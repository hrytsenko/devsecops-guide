---
title: Components
description: Design each component with its threats, interfaces, and access as code.
sidebar:
  order: 1
---

Design each component with its threats, interfaces, and access as code.

A component is the part of the software that one team designs, delivers, and runs on its own: its design models the threats that it faces and sets the requirements that it meets, declares the interfaces through which users and other components reach it, and decides what each user and component may do through them (see [OWASP SAMM]).
Every component goes through the same stages, so every change to it keeps its threats, interfaces, and access up to date, whether a person or an agent makes it.

| Stage                   | Description                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| [Assess](#assess)       | Settle the threats that each component faces and the requirements that it meets. |
| [Specify](#specify)     | Declare each interface and change it without breaking its consumers.             |
| [Authorize](#authorize) | Verify who is behind each request and what they may do.                          |

The principles apply to the components themselves:

- [Everything as code]: the threats, interfaces, and authorization of each component are files that change with its code.
- [Shift left]: people and agents settle the threats, interfaces, and access of each change while they make it.
- [Zero trust]: each component verifies who is behind every request and allows only what its authorization model grants.

## Foundations

### Identities

Users sign in through [OpenID Connect] with the users' identity provider, and every request that a component serves for a user carries a short-lived [OAuth 2.0] access token from it.
A component that calls another one without a user proves its identity with its service account, which the environment verifies on every call.
Trusting an identity that the gateway or the caller passes on is faster to start with, but lets one compromised component act as any user or component.

### Designs

Each component keeps its design in its repository next to its code: its threats in an [OWASP Threat Dragon] model, its requirements from [OWASP ASVS], its interfaces as [OpenAPI] documents and [gRPC] services, and its access in an [OpenFGA] authorization model.
People and agents change the design in the same pull request as the code that it describes, and review both together.
Keeping designs in a wiki is faster to start with, but lets them drift from the code that they describe.

## Assess

The assess stage settles the threats that each component faces and the requirements that it meets.

It applies [Everything as code] and [Shift left] and relies on [Explicit interface]: each component models its threats at the interfaces through which it's reached, updates the model with each change that alters them, and covers each requirement with a test, a rule, or a policy of the platform.

### Model threats

Model the threats to each component with STRIDE in an [OWASP Threat Dragon] diagram of its interfaces, data stores, and trust boundaries.
Update the model in the pull request of each change that adds an interface, a data store, or a call across a trust boundary, and draft each update with an agent that follows the threat modeling skill from the shared repository.
Record a mitigation in the model for each threat, or open an issue for it in the component's repository.

### Choose controls

Choose the [OWASP ASVS] level of each component from the data that it handles and the users who can reach it, and list the requirements of that level that apply to it.
Cover each requirement and each mitigation in its threat model with a test of the component, a rule of the shared rulesets, or a policy that the platform enforces.

## Specify

The specify stage declares each interface and changes it without breaking its consumers.

It applies [Everything as code] and [Shift left] and relies on [Explicit interface]: each interface is a specification in its component's repository that checks verify where each change is made, and each change to it stays compatible with its consumers, so its component deploys and rolls back on its own.

### Declare interfaces

Declare every interface of each component that users reach as an [OpenAPI] document, and every interface that only other components call as a [gRPC] service, each with the schemas of its requests and responses and the scopes that each operation requires for a user.
Register each specification as an API of the component in the [Backstage] software catalog.
Generate the component's server interfaces and its consumers' clients from each [OpenAPI] document with [OpenAPI Generator], and lint the document with [Spectral] against the shared rulesets.
Generate them from each [gRPC] service, lint it against the shared rulesets, and check it for breaking changes against the main branch with [Buf].

### Version interfaces

Keep each change to an interface backward compatible, and ship each breaking change as a new major version of the interface that the component serves beside the old one.
Mark the operations of each old version as deprecated in its specification, and remove them once no consumer's contract in the [Pact] broker uses them and the component's metrics show no calls to them.

## Authorize

The authorize stage verifies who is behind each request and what they may do.

It applies [Everything as code], [Shift left], and [Zero trust] and relies on [Explicit interface] and [External state]: each component authenticates and authorizes every request at its interface rather than trusting its caller, against an authorization model in its repository, tested where each change is made, and relations that a backing service holds.

### Authenticate users

Validate in each component the [OAuth 2.0] access token of each request that it serves for a user, and accept only tokens that the users' identity provider issued for that component, with the scopes that the request's operation requires.
For each call that a component makes to another component for the user, exchange the token through [OAuth 2.0] token exchange for one issued for that component.

### Authorize requests

Declare the authorization model of each component in [OpenFGA], as the relations that its users and its consumers' service accounts can have to its resources, and declare next to it the relations that it grants to its consumers' service accounts.
Keep both in a store of the component's own on the platform's [OpenFGA] server, write the relations of its users to it from the component as its resources change, check each request against the store in the component before acting on it, and deny the request when the store doesn't allow it or the check can't complete.
Test the allowed and denied cases of the model with the [OpenFGA] CLI on each change, and require a person from the owning team to approve each change to the model and its grants through the code owners file.

## References

Frameworks:

- [OWASP SAMM][]: software assurance.
- [OWASP ASVS][]: application security requirements.

Standards:

- [OpenID Connect][]: federated identity.
- [OAuth 2.0][]: delegated access.
- [OpenAPI][]: HTTP interfaces.
- [gRPC][]: remote procedure calls.

Code tools:

- [OWASP Threat Dragon][]: threat modeling tool.
- [OpenAPI Generator][]: OpenAPI code generator.
- [Spectral][]: OpenAPI linter.
- [Buf][]: gRPC linter and code generator.
- [Pact][]: contract testing tool.

Platform tools:

- [Backstage][]: developer portal.
- [OpenFGA][]: authorization service.

[Everything as code]: ../../principles/devsecops/#everything-as-code
[Shift left]: ../../principles/devsecops/#shift-left
[Zero trust]: ../../principles/devsecops/#zero-trust
[Explicit interface]: ../../principles/cloud-native/#explicit-interface
[External state]: ../../principles/cloud-native/#external-state

[OWASP SAMM]: https://owaspsamm.org/
[OWASP ASVS]: https://asvs.owasp.org/

[OpenID Connect]: https://openid.net/
[OAuth 2.0]: https://datatracker.ietf.org/wg/oauth/about/
[OpenAPI]: https://openapis.org/
[gRPC]: https://grpc.io/

[OWASP Threat Dragon]: https://owasp.org/projects/threat-dragon
[OpenAPI Generator]: https://openapi-generator.tech/
[Spectral]: https://github.com/stoplightio/spectral
[Buf]: https://github.com/bufbuild/buf
[Pact]: https://docs.pact.io/

[Backstage]: https://backstage.io/
[OpenFGA]: https://openfga.dev/
