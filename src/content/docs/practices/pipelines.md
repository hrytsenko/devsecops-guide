---
title: Pipelines
description: Move each change from commit to production through one automated path.
sidebar:
  order: 1
---

Move each change from commit to production through one automated path.

A pipeline takes each change that a team proposes, merges it into the main branch, builds it into a verified package, deploys that package to each environment, promotes it from one environment to the next, and releases its functionality to users (see [NIST SP 800-204D]).
Every component goes through the same stages, so the same controls apply to every change, whether a person or an agent made it.

| Stage               | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| [Merge](#merge)     | Decide how changes enter the main branch.                         |
| [Build](#build)     | Turn each change into the package that every environment runs.    |
| [Deploy](#deploy)   | Provision each environment and run what its repositories declare. |
| [Promote](#promote) | Move each verified package through environments to production.    |
| [Release](#release) | Expose the functionality of each new version to users.            |

The principles apply to the pipelines themselves:

- [Everything as code]: pipelines and their templates are manifests that change only through review, and the cluster runs them as the main branch declares.
- [Shift left]: people and agents run the same checks as the pipeline before they push, so they see its verdict first.
- [Zero trust]: each pipeline task uses short-lived credentials where possible, and runs under the same isolation as any other workload.
- [Closed loop]: each team measures the throughput and stability of its delivery, and fixes its pipelines where delivery slows down or breaks.

## Foundations

### Identities

People and agents prove their identities through [OpenID Connect] with the organization's identity provider, and [Tekton] tasks with their service accounts, to get short-lived credentials.
[Gitsign], [Cosign], and the [Tekton] chains controller sign with certificates for those identities from the organization's [Sigstore] instance.
Every person, agent, and task signs each commit it makes with [Gitsign], and a check verifies each commit in a pull request against the identity of its author.
Each image comes from one of two pipelines: a component's pipeline builds it and the [Tekton] chains controller signs it, or the platform team's import pipeline verifies a third-party image and signs it with [Cosign].
The public [Sigstore] instance is faster to start with, but records the identity of every signer in a public transparency log.

### Findings

Every check on a pull request is required, and each scanner reports its findings in [SARIF].
The rulesets of the checks decide which findings block a pull request or an image, and how long each finding can stay accepted (see [NIST SSDF]).
The team that owns the repository a finding comes from fixes it, or accepts it there when it can't, such as when a third-party component has no fix yet.
Only the platform team accepts admission findings, as [Kyverno] policy exceptions.
Each acceptance records a reason, an owner, and a date, as an [OpenVEX] statement for a vulnerability that doesn't affect the component.
Every check, including the image scan and the daily rescan, skips an accepted finding until it's older than its ruleset allows.
Ignoring findings in each tool's own configuration is faster to start with, but leaves them without owners or time limits.

### Repositories

Each team declares its part of every environment in its environment repository: infrastructure in [OpenTofu], components in [Kustomize] overlays, and feature flags in [flagd] definitions.
The platform team declares the shared parts, such as [Kyverno] admission policies, in its own environment repository, and keeps in a shared repository the pipeline templates, agent skills, rulesets of every check, and the list of third-party images to import.
Declaring environments in each component's repository is faster to start with, but every promotion then lands in the code's history and triggers its pipelines.

### Clusters

Pipelines run on the organization's [Kubernetes] clusters, under the platform team's control: [Tekton] runs their tasks and checks, [Argo CD] syncs environments (see [OpenGitOps]), and [Argo Rollouts] releases new versions in them.
This fits organizations that already run their environments on [Kubernetes].
A hosted CI service is faster to start with and offers many ready-made steps, but gives less control as delivery grows.

## Merge

The merge stage decides how changes enter the main branch.

It applies [Shift left] and [Zero trust] and relies on [Explicit interface]: each change is checked where it's made, tested against the interfaces it uses, reviewed by someone else, and traced to its author.

### Control changes

Merge small changes into the main branch at least daily, and keep unfinished functionality behind feature flags.
Run in [pre-commit] hooks every check that analyzes changes in the pipeline, with the same rulesets.
Protect the main branch: require a pull request and the required pipeline checks, and block direct and force pushes.
Require an approval from a person or an agent other than the author on every pull request except those that promote an image or a module version to an environment.
Assign reviewers by path in a code owners file, and require a person from the owning team to approve changes to sensitive paths, such as pipeline templates, policies, and accepted findings.
Pin dependencies in lock files, base images by digest, and [Tekton] tasks and tools by version, and open update pull requests for each of them with [Renovate].

### Analyze changes

Scan each change for credentials with [Gitleaks].
Run static analysis on source code with [Semgrep], scan dependencies with [Grype], and lint Dockerfiles with [Hadolint].
Scan [OpenTofu] code with [Trivy] for infrastructure misconfigurations, and validate [Kubernetes] manifests with the [Kyverno] CLI against the environments' admission policies.
Review each change with an agent that loads instructions from the [AGENTS.md] files of the main branch and [Agent Skills] from the shared repository, and post its findings as pull request comments.

### Test changes

Build each change and run its tests.
Define what each consumer expects from the components it calls as [Pact] contracts in its tests, and publish them from each change to the [Pact] broker.
Verify each provider change against the contracts from its consumers' main branches and from every version deployed in an environment, and publish the results to the [Pact] broker.
Verify the provider's main branch against each changed contract from a [Pact] broker webhook, and block the consumer's change until the verification passes.

## Build

The build stage turns each change into the package that every environment runs.

It applies [Zero trust] and relies on [Portable package]: every later stage verifies the package rather than trusting it (see [NIST SP 800-190]), and the pipeline builds it once for every environment.

### Build images

Build each merged change into an [OCI] image with [Buildah] from a [Distroless] base image pinned by digest, in an unprivileged task from the platform team's templates.
Generate an SBOM of each image with [Syft] in [SPDX] format, and scan it with [Grype] before pushing the image.
Attest each image's SBOM with [Cosign] in another task from those templates, with its own service account.
Sign each image and attest its [SLSA] provenance in [in-toto] format with the [Tekton] chains controller.

### Store images

Store each image with its signatures, SBOM, and provenance in [Harbor].
Grant push access to a component's [Harbor] project only to that component's pipeline, and pull access only to environments and to the tasks that verify or rescan its images, through [Harbor] robot accounts.
Import each third-party image, such as a base image or a platform component, by digest through a [Harbor] proxy cache, in a pipeline of the platform team that verifies its publisher's signature with [Cosign] where the publisher signs it.
Generate, scan, and attest an SBOM of each imported image as for the organization's own images, sign it with [Cosign], store it in a [Harbor] project of the platform team, and pull it in builds and environments only from there.
Rescan daily with [Grype] the SBOM of each image that an environment repository declares, and for each new finding that the shared rulesets block, open an issue in the repository that the image comes from.

## Deploy

The deploy stage provisions each environment and runs what its repositories declare.

It applies [Everything as code] and [Zero trust] and relies on [External configuration]: each environment reconciles with the state that its repositories declare, admits only signed images, and gives every component its own configuration and credentials.

### Reconcile infrastructure

Write reusable [OpenTofu] modules in a repository of the owning team, and release each merged change to them as a new version.
Declare the resources of each environment in an [OpenTofu] configuration, pin its modules by version, and encrypt its state with [OpenTofu] state encryption.
Plan each change for every environment that it affects from a task with read-only credentials, and post each plan as a pull request comment.
Apply each merged change from a task, and reapply every environment daily.
Promote each module version from a task that opens a pull request with it: to the first environment after it's released, and to each next environment after it applies in the current one.
Hold any apply that would destroy or replace a resource until a person from the owning team approves it.

### Reconcile environments

Declare each component's image digest and environment-specific configuration for each environment in a [Kustomize] overlay, and sync the overlays and [flagd] definitions with [Argo CD] with automated pruning and self-healing.
Restrict each team's [Argo CD] project to the team's own namespaces, and allow cluster-scoped resources and [Kyverno] policy exceptions only in the platform team's project.
Sync secrets into each environment from the organization's secret store with [ESO], and keep them out of every environment repository.
Enforce the platform team's admission policies in each environment with [Kyverno], and admit only images from the organization's [Harbor] that are referenced by digest and attested with an SBOM, and either signed by the [Tekton] chains controller with [SLSA] provenance that names their component's repository, or signed by the platform team's import pipeline.

## Promote

The promote stage moves each verified package through environments to production.

It applies [Zero trust] and relies on [Portable package] and [Explicit interface]: the same image moves from one environment to the next only through verified promotions, and a component's image enters each only when it's compatible with every component deployed there.

### Promote images

Promote each image from a task in the platform team's templates that opens a pull request with its digest in an environment's overlay when the [Pact] broker confirms that it's compatible with every component deployed there.
Promote it to the first environment after it's signed and attested, and to each next environment after it rolls out and passes smoke tests with [Playwright] in the current one and, in pre-production, a dynamic scan with [ZAP].
Promote each imported image that an environment runs the same way, without the [Pact] broker check.
Record in the [Pact] broker each version that runs in an environment, from the task that runs its smoke tests there, before they start.
Roll back an image from the promotion task, as a promotion of the digest that the environment ran before, when its rollout or smoke tests fail, or when its owning team asks.

### Verify promotions

Verify on each pull request to an environment repository that only promotion commits set or update image digests or module versions, that a promotion task signed each of them with [Gitsign], and that they change nothing else.
Verify that each new digest or module version is one that the previous environment runs or that this environment ran before.
In the first environment, verify instead with [Cosign] that the [Tekton] chains controller signed it with [SLSA] provenance naming the main branch of its component's repository, or that the platform team's import pipeline signed it.
Merge each promotion automatically without an approval when its required checks pass, in every environment including production.

## Release

The release stage exposes the functionality of each new version to users.

It applies [Closed loop] and relies on [External state] and [Built-in telemetry]: each new version runs beside the stable one on the same state, signals that every component emits the same way decide whether a rollout continues or rolls back, and delivery metrics return to the team that owns each component.

### Flag features

Ship new functionality turned off behind feature flags that the component reads through [OpenFeature].
Define each flag and its targeting rules, and serve them with [flagd].
Turn each flag on for selected users by changing its targeting rules, compare the metrics of its variants in [Prometheus], and then turn it on for every user.
Remove each flag from the code and from the environment repository once its functionality reaches every user.

### Release canaries

Release each new version as a canary with [Argo Rollouts], and shift traffic to it from users and from other components through [Istio].
Keep each database schema change compatible with the stable version, and ship it in an earlier version than the code that depends on it.
Define the success criteria of each canary increment as [Prometheus] queries in an [Argo Rollouts] analysis template that compare the canary with the stable version.
Send the result of each rollout to the team that owns the component through [Argo Rollouts] notifications.

### Measure delivery

Collect the metrics of [Tekton] pipeline runs, [Argo CD] syncs, and [Argo Rollouts] canaries into [Prometheus], labeled by component and environment.
Track the [DORA] metrics of each team in [Prometheus]: how often it deploys to production, how long its changes take to reach production, how often its deployments fail in production, and how long it takes to recover from a failed deployment.
Alert the owning team through [Prometheus] alerting rules when its pipeline runs fail or slow down.

## References

Frameworks:

- [NIST SSDF][]: secure software development.
- [NIST SP 800-190][]: container security.
- [NIST SP 800-204D][]: supply chain security.
- [SLSA][]: build integrity and provenance.
- [OpenGitOps][]: GitOps.
- [DORA][]: delivery performance.

Standards:

- [OpenID Connect][]: federated identity.
- [OCI][]: container images and registries.
- [SPDX][]: SBOMs.
- [in-toto][]: supply chain attestations.
- [SARIF][]: analysis findings.
- [OpenVEX][]: vulnerability statements.
- [OpenFeature][]: feature flags.
- [AGENTS.md][]: agent instructions.
- [Agent Skills][]: agent skills.

Code tools:

- [pre-commit][]: commit hook framework.
- [Gitleaks][]: credential scanner.
- [Semgrep][]: static analysis tool.
- [Trivy][]: misconfiguration scanner.
- [Renovate][]: dependency update bot.
- [Gitsign][]: commit signing tool.
- [Pact][]: contract testing tool.

Image tools:

- [Hadolint][]: Dockerfile linter.
- [Distroless][]: minimal base images.
- [Buildah][]: rootless image builder.
- [Grype][]: vulnerability scanner.
- [Syft][]: SBOM generator.
- [Cosign][]: image signing tool.
- [Harbor][]: image registry.

Pipeline tools:

- [Tekton][]: pipeline engine.
- [Sigstore][]: keyless signing toolkit.
- [Argo CD][]: GitOps controller.
- [Argo Rollouts][]: delivery controller.
- [Kustomize][]: configuration overlays.
- [OpenTofu][]: IaC toolkit.
- [Playwright][]: smoke testing tool.
- [ZAP][]: dynamic application scanner.

Environment tools:

- [Kubernetes][]: orchestration platform.
- [Istio][]: service mesh.
- [Kyverno][]: policy engine.
- [ESO][]: external secrets manager.
- [flagd][]: feature flag service.
- [Prometheus][]: metrics store.

[Closed loop]: ../../principles/devsecops/#closed-loop
[Everything as code]: ../../principles/devsecops/#everything-as-code
[Shift left]: ../../principles/devsecops/#shift-left
[Zero trust]: ../../principles/devsecops/#zero-trust
[Portable package]: ../../principles/cloud-native/#portable-package
[External configuration]: ../../principles/cloud-native/#external-configuration
[Explicit interface]: ../../principles/cloud-native/#explicit-interface
[External state]: ../../principles/cloud-native/#external-state
[Built-in telemetry]: ../../principles/cloud-native/#built-in-telemetry

[NIST SSDF]: https://csrc.nist.gov/pubs/sp/800/218/final
[NIST SP 800-190]: https://csrc.nist.gov/pubs/sp/800/190/final
[NIST SP 800-204D]: https://csrc.nist.gov/pubs/sp/800/204/d/final
[SLSA]: https://slsa.dev/
[OpenGitOps]: https://opengitops.dev/
[DORA]: https://dora.dev/

[OpenID Connect]: https://openid.net/
[OCI]: https://opencontainers.org/
[SPDX]: https://spdx.dev/
[in-toto]: https://in-toto.io/
[SARIF]: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
[OpenVEX]: https://openvex.dev/
[OpenFeature]: https://openfeature.dev/
[AGENTS.md]: https://agents.md/
[Agent Skills]: https://agentskills.io/

[pre-commit]: https://pre-commit.com/
[Gitleaks]: https://github.com/gitleaks/gitleaks
[Semgrep]: https://github.com/semgrep/semgrep
[Trivy]: https://trivy.dev/
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
[Sigstore]: https://www.sigstore.dev/
[Argo CD]: https://argo-cd.readthedocs.io/
[Argo Rollouts]: https://argo-rollouts.readthedocs.io/
[Kustomize]: https://kustomize.io/
[OpenTofu]: https://opentofu.org/
[Playwright]: https://playwright.dev/
[ZAP]: https://www.zaproxy.org/

[Kubernetes]: https://kubernetes.io/
[Istio]: https://istio.io/
[Kyverno]: https://kyverno.io/
[ESO]: https://external-secrets.io/
[flagd]: https://flagd.dev/
[Prometheus]: https://prometheus.io/
