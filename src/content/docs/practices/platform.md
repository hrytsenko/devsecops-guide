---
title: Platform
description: Offer each team self-service capabilities with their controls built in.
sidebar:
  order: 4
---

Offer each team self-service capabilities with their controls built in.

A platform offers every team the capabilities that its components need, such as pipelines, environments, and backing services, as products that the team requests on its own: it publishes each one with its controls built in, creates each component with everything it needs, and changes its capabilities and controls without breaking the teams that use them (see [CNCF Platforms]).
Every team gets each capability through the same templates and APIs, so every component starts and grows under the same controls, whether a person or an agent requests it.

| Stage               | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| [Offer](#offer)     | Publish each capability with its docs and controls built in.               |
| [Onboard](#onboard) | Create each component with everything it needs in one request.             |
| [Evolve](#evolve)   | Change capabilities and controls without breaking the teams that use them. |

The principles apply to the platform itself:

- [Self-service]: teams request each capability themselves, and get it with its controls built in.
- [Zero trust]: each component gets its own identity and scope, and each capability gives access only to its component.
- [Closed loop]: teams see each new control before it blocks them, and their issues and delivery metrics decide what the platform changes.

## Foundations

### Owners

The [Backstage] software catalog records who owns what.
Each team is a group that the catalog syncs from the organization's identity provider, and each component, interface, capability, and template is an entity that a descriptor file in its repository declares with its owning team.
Every other record of an owner, such as a code owners file, a namespace label, or an alert route, names the same team as the catalog.
Recording owners in each tool on its own is faster to start with, but lets the records drift apart as teams change.

### Requests

Teams request every capability through Git: people run [Backstage] software templates in the portal, agents run them through its API, and each template commits under the identity of whoever runs it, in a new repository or in a pull request that the team reviews and merges like any other change.
Teams can also write the same changes by hand from the examples in each capability's docs.
A portal that provisions resources directly is faster to start with, but bypasses review and leaves nothing for the pipeline to reconcile.

### Capabilities

Each capability is a [Crossplane] composite resource definition and its composition: the definition is the API in which teams set a few inputs, and the composition sets everything else with the platform's controls.
Teams declare only composite resources, never the managed resources of [Crossplane] providers.
Declaring managed resources directly is faster to start with, but leaves each team to set and keep every control on its own.

## Offer

The offer stage publishes each capability with its docs and controls built in.

It applies [Self-service] and [Zero trust] and relies on [External configuration] and [External state]: each backing service that the platform offers holds the state of one component, grants access only to that component's identity, and hands its endpoints to the component through the environment.

### Define capabilities

Define each component's pipeline as a capability that composes its [Tekton] triggers, its service accounts, and its [Harbor] project with robot accounts.
Define each component's part of an environment as a capability that composes the service account, resource quota, and default policies that the environment requires of it.
Define each backing service that a component needs, such as a database or a bucket, as a capability with a few inputs, such as its size and version.
Compose each one with encryption, private networking, backups on its environment's schedule, access only for its component's service account, egress to it from its component's namespace, and a secret with its endpoints in that namespace.

### Publish capabilities

Document each capability in [Backstage] TechDocs next to its composition, with an example composite resource for each common use.
Offer each capability through a [Backstage] software template that asks for its inputs and opens a pull request with its composite resource in the team's environment repository.

## Onboard

The onboard stage creates each component with everything it needs in one request.

It applies [Self-service] and [Zero trust] and relies on [Portable package] and [Built-in telemetry]: a template per language gives each component its own identity and scope in every pipeline and environment from its first change, and fits every component because each one ships and reports the same way.

### Create components

Create each component from a [Backstage] software template for its language, with its name and its owning team.
Create its repository with a catalog descriptor, a code owners file, agent instructions, and a pipeline that references the shared templates by version.
Start its code with health endpoints, telemetry, and a Dockerfile.

### Provision components

Open a pull request from the same template in the team's environment repository with the component's [Kustomize] overlay for each environment and the composite resources of its pipeline and of its part of each environment.
Generate an [Argo CD] application for each overlay with an [Argo CD] application set, and create the namespace of each application with the labels of its team and component.

## Evolve

The evolve stage changes capabilities and controls without breaking the teams that use them.

It applies [Closed loop] and relies on [External state]: every component survives the replacement of its instances and nodes in each upgrade, each new control reports its violations to their owners before it blocks them, and the issues and delivery metrics of teams decide what the platform team changes next.

### Change capabilities

Plan each change to a capability from the issues that teams open about it in the shared repository and from the [DORA] metrics of the teams that use it.
Keep each composite resource definition backward compatible, and ship each breaking change as a new definition that runs beside the old one.
Deprecate each old definition through a new admission policy, and remove it once no composite resource uses it.
Leave deletion out of the [Crossplane] management policies of each composed resource that holds state, such as a database or a bucket, and delete it only when its component retires and its retention period ends.
Upgrade every cluster to each new [Kubernetes] minor version before its current version leaves support, environment by environment in the order of promotion.

### Change controls

Roll out each new [Kyverno] admission policy in audit mode and each new rule of the shared rulesets as a warning, each with a date in its docs when it starts to block.
Report each violation of a policy in audit mode to the team that owns its namespace through [Policy Reporter].
Enforce each policy, and raise each rule to an error, on its date.

## References

Frameworks:

- [CNCF Platforms][]: platform engineering.
- [DORA][]: delivery performance.

Platform tools:

- [Backstage][]: developer portal.
- [Crossplane][]: infrastructure control plane.
- [Harbor][]: image registry.

Pipeline tools:

- [Tekton][]: pipeline engine.
- [Argo CD][]: GitOps controller.
- [Kustomize][]: configuration overlay tool.

Environment tools:

- [Kubernetes][]: orchestration platform.
- [Kyverno][]: policy engine.
- [Policy Reporter][]: policy report notifier.

[Self-service]: ../../principles/devsecops/#self-service
[Zero trust]: ../../principles/devsecops/#zero-trust
[Closed loop]: ../../principles/devsecops/#closed-loop
[Portable package]: ../../principles/cloud-native/#portable-package
[External configuration]: ../../principles/cloud-native/#external-configuration
[External state]: ../../principles/cloud-native/#external-state
[Built-in telemetry]: ../../principles/cloud-native/#built-in-telemetry

[CNCF Platforms]: https://tag-app-delivery.cncf.io/whitepapers/platforms/
[DORA]: https://dora.dev/

[Backstage]: https://backstage.io/
[Crossplane]: https://www.crossplane.io/
[Harbor]: https://goharbor.io/

[Tekton]: https://tekton.dev/
[Argo CD]: https://argo-cd.readthedocs.io/
[Kustomize]: https://kustomize.io/

[Kubernetes]: https://kubernetes.io/
[Kyverno]: https://kyverno.io/
[Policy Reporter]: https://kyverno.github.io/policy-reporter/
