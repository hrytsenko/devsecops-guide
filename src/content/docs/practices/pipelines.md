---
title: Pipelines
description: Move each change from commit to production through one automated path.
sidebar:
  order: 1
---

Move each change from commit to production through one automated path.

A pipeline takes a change that a team merges, builds it into a verified package, deploys that package to environments, and releases its functionality to users.
Every component goes through the same stages, so the same controls apply to every change, whether a person or an agent made it.

| Stage               | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| [Merge](#merge)     | Decide how changes enter the main branch.                         |
| [Build](#build)     | Turn each change into the package that every environment runs.    |
| [Deploy](#deploy)   | Provision each environment and make a verified package run in it. |
| [Release](#release) | Expose the functionality of each new version to users.            |

The principles apply to the pipelines themselves:

- [Everything as code]: pipelines and their templates are manifests that change only through review, and the cluster runs them as the main branch declares.
- [Shift left]: each check that analyzes changes in the merge stage also runs in pre-commit hooks with the same rulesets, so people and agents see its verdict before they push.
- [Self-service]: the platform team owns and shares pipeline templates, and each team builds its own pipelines from those templates.
- [Zero trust]: each pipeline task uses short-lived credentials where possible, and runs under the same isolation as any other workload.
- [Closed loop]: each team measures the throughput and stability of its delivery, and fixes its pipelines where delivery slows down or breaks.

The guide builds pipelines from Kubernetes-native tools: [Tekton] runs their tasks and checks, [Argo CD] syncs environments, and [Argo Rollouts] releases new versions.
They fit organizations that already run environments on [Kubernetes], where the platform team controls how every pipeline runs.
A hosted CI service is faster to start with and offers many ready-made steps, but gives less control as delivery grows.

Each team declares its part of every environment in its environment repository: infrastructure in [OpenTofu], components in [Kustomize] overlays, and feature flags in [flagd] definitions.
The platform team declares the shared parts, such as [Kyverno] admission policies, in its own environment repository, and keeps pipeline templates, agent skills, and the rulesets of every check in a shared repository.
Every check on a pull request is required, and blocks the change on any finding that those rulesets block.
Declaring environments in each component's repository is faster to start with, but every promotion then lands in the code's history and triggers its pipelines.

People and agents prove their identities through [OpenID Connect] with the organization's identity provider, and [Tekton] tasks with their service accounts, to get short-lived credentials.
[Gitsign], [Cosign], and [Tekton Chains] sign with certificates for those identities from the organization's [Sigstore] instance.
Every person, agent, and task signs each commit it makes with [Gitsign], and a check verifies each commit in a pull request against the identity of its author.
The public Sigstore instance is faster to start with, but records the identity of every signer in a public transparency log.

## Merge

The merge stage decides how changes enter the main branch.

It applies [Shift left] and [Zero trust] and relies on [Explicit interface]: each change is checked where it's made, tested against the interfaces it uses, reviewed by someone else, and traced to its author.

### Control changes

Merge small changes into the main branch at least daily, and keep unfinished functionality behind feature flags.
Protect the main branch: require a pull request, the required pipeline checks, and an approval from a person or an agent other than the author for every pull request except those that promote a package to an environment, and block direct and force pushes.
Assign reviewers by path in a code owners file, and require a person from the owning team to approve changes to sensitive paths, such as pipeline templates, policies, and accepted findings.
Open update pull requests with [Renovate] for dependencies, base image digests, [Tekton] task versions, and tool versions.

### Analyze changes

Scan each change for credentials with [Gitleaks].
Run static analysis on source code with [Semgrep], scan dependencies with [Grype], and lint Dockerfiles with [Hadolint].
Scan [OpenTofu] code with [Trivy] for infrastructure misconfigurations, and validate [Kubernetes] manifests with the [Kyverno] CLI against the environments' admission policies.
Review each change with an agent that loads instructions from [AGENTS.md] files and [Agent Skills] from the shared repository, and post its findings as pull request comments.
Record each finding that the owning team accepts in the component's repository with a reason, an owner, and an expiry within the limit that the shared rulesets set for its severity, as an [OpenVEX] statement for a vulnerability, and exclude it from every check, including the image scan and the daily rescan, until its acceptance expires.

### Test changes

Build each change and run its tests.
Define what each consumer expects from the components it calls as [Pact] contracts in its tests, and publish them from each change to the [Pact Broker].
Verify each provider change against the contracts from its consumers' main branches and from every version deployed in an environment, and publish the results to the [Pact Broker].
Verify the provider's main branch against each changed contract from a [Pact Broker] webhook, and block the consumer's change until the verification passes.

## Build

The build stage turns each change into the package that every environment runs.

It applies [Zero trust] and relies on [Portable package]: every later stage verifies the package rather than trusting it, and the pipeline builds it once for every environment.

### Build images

Build each merged change into an [OCI] image with [Buildah] from a [Distroless] base image pinned by digest, in an unprivileged task from the platform team's templates.
Generate an SBOM of each image with [Syft] in [SPDX] format, scan it with [Grype] before pushing the image, and block images with findings.
Attest each image's SBOM with [Cosign] in another task from those templates, with its own service account.
Sign each image and attest its [SLSA] provenance in [in-toto] format with [Tekton Chains].

### Store images

Store each image with its signatures, SBOM, and provenance in [Harbor].
Grant push access to a component's Harbor project only to that component's pipeline, and pull access only to environments and to the tasks that verify or rescan its images, through Harbor robot accounts.
Import each third-party image, such as a base image or a platform component, by digest through a Harbor proxy cache, in a pipeline of the platform team that verifies its publisher's signature with [Cosign] where the publisher signs it.
Generate, scan, and attest an SBOM of each imported image as for the organization's own images, sign it with [Cosign], store it in a Harbor project of the platform team, and pull it in builds and environments only from there.
Rescan with [Grype], in a daily pipeline, the SBOM of each image whose digest an environment repository declares, and open an issue in the component's repository for each new finding that the shared rulesets block.

## Deploy

The deploy stage provisions each environment and makes a verified package run in it.

It applies [Everything as code] and relies on [Portable package] and [External configuration]: each environment reconciles with the state that a repository declares, runs the same package with its own configuration, and gets through promotion only packages built from reviewed changes.

### Reconcile infrastructure

Write reusable [OpenTofu] modules in a repository of the owning team, and release each merged change to them as a new version.
Declare the resources of each environment in an [OpenTofu] configuration, pin its modules by version, and encrypt its state with [OpenTofu] state encryption.
Plan each change for every environment that it affects from a task with read-only credentials, and post each plan as a pull request comment.
Apply each merged change from a task, and reapply every environment daily.
Promote each module version to the next environment from a task that opens a pull request with it once it applies in the current environment.
Hold any apply that would destroy or replace a resource until the team that owns the resource approves it.

### Reconcile environments

Declare each component's image digest and environment-specific configuration for each environment in a [Kustomize] overlay, and sync it with [Argo CD] with automated pruning and self-healing.
Restrict each team's [Argo CD] project to the team's own namespaces, and allow cluster-scoped resources and [Kyverno] policy exceptions only in the platform team's project.
Sync secrets into each environment from the organization's secret store with [ESO], and keep them out of every environment repository.
Enforce the platform team's admission policies in each environment with [Kyverno], and admit only images from the organization's [Harbor] that are referenced by digest and attested with an SBOM, and either signed by [Tekton Chains] with SLSA provenance that names their component's repository, or signed by the platform team's import pipeline.
Give people and agents read-only access to environments.

### Promote packages

Promote each package from a task in the platform team's templates that opens a pull request with its digest in an environment's overlay when the [Pact Broker] confirms that it's compatible with every component deployed there: to the first environment once its image is signed and attested, and to each next environment after the package passes smoke tests with [Playwright] in the current one and, in pre-production, a dynamic scan with [ZAP].
Record in the [Pact Broker] each version that runs in an environment, from the task that runs its smoke tests there.
Verify on each pull request that only promotion commits change image digests: that the promotion task signed each of them, that they change nothing else, and that each new digest is one that the previous environment runs, that this environment ran before, or, in the first environment, that [Tekton Chains] signed with SLSA provenance naming the main branch of the component's repository.
Merge each promotion automatically without an approval when its required checks pass, in every environment including production.
Roll back a package from the promotion task, as a promotion of the digest that the environment ran before, when its canary fails or when its owning team asks.

## Release

The release stage exposes the functionality of each new version to users.

It applies [Closed loop] and relies on [Built-in telemetry]: signals that every component emits the same way decide whether a rollout continues or rolls back, and delivery metrics return to the team that owns each component.

### Flag features

Ship new functionality turned off behind feature flags that the component reads through [OpenFeature].
Define each flag and its targeting rules, and serve them with [flagd].
Turn each flag on for selected users first, then for every user, by changing its targeting rules.
Remove each flag from the code and from the environment repository once its functionality reaches every user.

### Release canaries

Release each new version as a canary with [Argo Rollouts], and shift traffic to it through [Envoy Gateway].
Collect the metrics of each version with [OpenTelemetry] into [Prometheus], labeled by version.
Define the success criteria of each canary increment as [Prometheus] queries in an [Argo Rollouts] analysis template that compare the canary with the stable version.
Send the result of each rollout to the team that owns the component through [Argo Rollouts] notifications.

### Measure delivery

Collect the metrics of [Tekton] pipeline runs, [Argo CD] syncs, and [Argo Rollouts] canaries into [Prometheus], labeled by component and environment.
Track for each team in [Prometheus] how often it deploys to production, how long its changes take to reach production, how often its deployments roll back, and how long it takes to recover from a failed deployment.
Alert the owning team through [Prometheus] alerting rules when its pipeline runs fail or slow down.

## References

### Frameworks

- [NIST SSDF][]: secure software development.
- [NIST SP 800-190][]: container security.
- [NIST SP 800-204D][]: supply chain security.
- [SLSA][]: build integrity and provenance.
- [OpenGitOps][]: GitOps.

### Standards

- [OpenID Connect][]: federated identity.
- [OCI][]: container images and registries.
- [SPDX][]: SBOMs.
- [in-toto][]: supply chain attestations.
- [OpenVEX][]: vulnerability statements.
- [OpenFeature][]: feature flags.
- [OpenTelemetry][]: traces, metrics, and logs.
- [AGENTS.md][]: agent instructions.
- [Agent Skills][]: agent skills.

### Code tools

- [pre-commit][]: commit hook framework.
- [Gitleaks][]: credential scanner.
- [Semgrep][]: static analysis tool.
- [Renovate][]: dependency update bot.
- [Gitsign][]: commit signing tool.
- [Pact][]: contract testing tool.

### Image tools

- [Hadolint][]: Dockerfile linter.
- [Distroless][]: minimal base images.
- [Buildah][]: rootless image builder.
- [Grype][]: vulnerability scanner.
- [Syft][]: SBOM generator.
- [Cosign][]: image signing tool.
- [Harbor][]: image registry.

### Pipeline tools

- [Tekton][]: pipeline engine.
- [Tekton Chains][]: provenance controller.
- [Sigstore][]: keyless signing toolkit.
- [Argo CD][]: GitOps controller.
- [Argo Rollouts][]: delivery controller.
- [Kustomize][]: configuration overlays.
- [OpenTofu][]: IaC toolkit.
- [Trivy][]: misconfiguration scanner.
- [Pact Broker][]: contract registry.
- [Playwright][]: smoke testing tool.
- [ZAP][]: dynamic application scanner.

### Environment tools

- [Kubernetes][]: orchestration platform.
- [Envoy Gateway][]: application gateway.
- [Kyverno][]: policy engine.
- [ESO][]: external secrets manager.
- [flagd][]: feature flag service.
- [Prometheus][]: metrics store.

[Closed loop]: ../../principles/devsecops/#closed-loop
[Everything as code]: ../../principles/devsecops/#everything-as-code
[Self-service]: ../../principles/devsecops/#self-service
[Shift left]: ../../principles/devsecops/#shift-left
[Zero trust]: ../../principles/devsecops/#zero-trust
[Portable package]: ../../principles/cloud-native/#portable-package
[External configuration]: ../../principles/cloud-native/#external-configuration
[Explicit interface]: ../../principles/cloud-native/#explicit-interface
[Built-in telemetry]: ../../principles/cloud-native/#built-in-telemetry

[NIST SSDF]: https://csrc.nist.gov/pubs/sp/800/218/final
[NIST SP 800-190]: https://csrc.nist.gov/pubs/sp/800/190/final
[NIST SP 800-204D]: https://csrc.nist.gov/pubs/sp/800/204/d/final
[SLSA]: https://slsa.dev/
[OpenGitOps]: https://opengitops.dev/

[OpenID Connect]: https://openid.net/
[OCI]: https://opencontainers.org/
[SPDX]: https://spdx.dev/
[in-toto]: https://in-toto.io/
[OpenVEX]: https://openvex.dev/
[OpenFeature]: https://openfeature.dev/
[OpenTelemetry]: https://opentelemetry.io/
[AGENTS.md]: https://agents.md/
[Agent Skills]: https://agentskills.io/

[pre-commit]: https://pre-commit.com/
[Gitleaks]: https://github.com/gitleaks/gitleaks
[Semgrep]: https://github.com/semgrep/semgrep
[Renovate]: https://github.com/renovatebot/renovate
[Gitsign]: https://github.com/sigstore/gitsign
[Pact]: https://docs.pact.io/

[Hadolint]: https://github.com/hadolint/hadolint
[Distroless]: https://github.com/GoogleContainerTools/distroless
[Buildah]: https://buildah.io/
[Grype]: https://github.com/anchore/grype
[Syft]: https://github.com/anchore/syft
[Cosign]: https://github.com/sigstore/cosign
[Harbor]: https://goharbor.io/

[Tekton]: https://tekton.dev/
[Tekton Chains]: https://tekton.dev/docs/chains/
[Sigstore]: https://www.sigstore.dev/
[Argo CD]: https://argo-cd.readthedocs.io/
[Argo Rollouts]: https://argo-rollouts.readthedocs.io/
[Kustomize]: https://kustomize.io/
[OpenTofu]: https://opentofu.org/
[Trivy]: https://trivy.dev/
[Pact Broker]: https://docs.pact.io/pact_broker
[Playwright]: https://playwright.dev/
[ZAP]: https://www.zaproxy.org/

[Kubernetes]: https://kubernetes.io/
[Envoy Gateway]: https://gateway.envoyproxy.io/
[Kyverno]: https://kyverno.io/
[ESO]: https://external-secrets.io/
[flagd]: https://flagd.dev/
[Prometheus]: https://prometheus.io/
