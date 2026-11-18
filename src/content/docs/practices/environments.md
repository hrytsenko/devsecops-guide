---
title: Environments
description: Run each component isolated, observed, and recoverable in every environment.
sidebar:
  order: 2
---

Run each component isolated, observed, and recoverable in every environment.

An environment runs the components that teams deliver to it: it isolates each one, returns its signals to the team that owns it, detects threats against it, and lets that team respond to incidents and recover from failures (see [NIST CSF]).
Every component runs under the same controls in every environment, so a team operates each of its components the same way, whether a person or an agent does the work.

| Stage               | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| [Isolate](#isolate) | Confine each component to its own scope.                      |
| [Observe](#observe) | Return the signals and threats of each component to its team. |
| [Respond](#respond) | Analyze, contain, and mitigate incidents.                     |
| [Recover](#recover) | Keep components available and restore their state.            |

The principles apply to the environments themselves:

- [Zero trust]: each workload proves its identity on every call and reaches only what its policies allow, and no person or agent holds standing write access.
- [Closed loop]: each team gets the signals and alerts of its components, and ends each incident with a fix and a new check.

## Foundations

### Identities

Each component runs under a service account of its own and proves its identity with it: to other workloads with a [SPIFFE] certificate that [Istio] issues, and to cloud services with a short-lived token through [OpenID Connect] federation.
No component holds a static credential for a service that accepts these identities.
Static keys are faster to start with, but stay valid wherever they leak until someone rotates them.

### Permissions

People and agents have read-only access to every environment.
When a change can't wait for the pipeline, such as a quarantine or a mitigation, a person gets write access to the affected namespaces, nodes, or [Velociraptor] for a few hours through a group in the identity provider, on approval by another person from the team that owns them.
Standing admin access is faster to start with, but lets one leaked credential change production.

### Signals

Every component and cluster sends its logs, metrics, and traces through the [OpenTelemetry Collector] of its cluster, which exports metrics to [Prometheus], traces to [Jaeger], and logs to [OpenSearch].
[Alertmanager] routes each alert to the team that owns the namespace it comes from.
People and agents read every signal through [OpenID Connect] with the organization's identity provider.
Sending signals from each component straight to its backends is faster to start with, but leaves each team to label, filter, and route them on its own.

### Clusters

Each environment runs on [Kubernetes] clusters of its own, apart from the clusters that run pipelines and the platform's shared services, such as the signal backends.
The platform team runs [Istio], [Falco], [Velociraptor], and the [OpenTelemetry Collector] in every one of these clusters, [Velero] in each environment's clusters, and [Chaos Mesh] in the pre-production clusters.
Sharing clusters between environments is faster to start with, but lets a failure or a compromise in one environment reach production.

## Isolate

The isolate stage confines each component to its own scope.

It applies [Zero trust] and relies on [External configuration] and [Explicit interface]: each component runs with least privilege under the identity that the environment gives it, and reaches another component only through the interface that it exposes and the policies that its owner sets.

### Harden workloads

Run each component in a namespace of its own in every environment, label the namespace with its team and component, and limit its resources with a resource quota.
Run the pods of every component under the restricted profile of the Pod Security Standards, and only the platform team's node daemons, such as [Falco], the [OpenTelemetry Collector], and the Istio CNI agent, outside it.
Run each agent, and each workload that runs code it didn't ship, in a [gVisor] sandbox through a Kubernetes runtime class.

### Restrict traffic

Enforce mutual TLS between all workloads with [Istio], and deny every call to a namespace by default with an [Istio] authorization policy.
Allow the calls to each component with [Istio] authorization policies that name the [SPIFFE] identities of its consumers.
Allow egress from each namespace only through an [Istio] egress gateway to the external hosts that its team declares in its environment repository, and block any other egress with Kubernetes network policies.
Expose components to users only through an [Istio] ingress gateway.

## Observe

The observe stage returns the signals and threats of each component to its team.

It applies [Closed loop] and [Zero trust] and relies on [Portable package] and [Built-in telemetry]: every component emits its signals the same way and runs only the image it came from, so the environment alerts the team that owns it when the component misses its objectives or drifts from its image.

### Collect signals

Collect with the [OpenTelemetry Collector] the logs of every container, the metrics of every node and Kubernetes component, and the audit logs of every cluster and cloud account, and receive in it the signals that each component sends through [OpenTelemetry].
Label each signal in the Collector with the team and component of its namespace, the version of its pod, and the environment of its cluster.

### Detect threats

Run [Falco] on every node with the platform team's rules, and feed it the events of every [gVisor] sandbox and the audit logs.
Store each [Falco] alert in [OpenSearch], and alert the on-call persons of the owning team and the platform team through [Alertmanager] on each critical one, such as a shell or a new executable in a running container, or a change to an environment from a person or an agent.

### Alert owners

Define the service level objectives of each component, such as its availability and latency, as [Prometheus] rules.
Alert the on-call person of the owning team through [Alertmanager] when a component burns its error budget faster than its objectives allow.
Define the objectives of each cluster and of the platform's shared services the same way, and alert the platform team on them.

## Respond

The respond stage analyzes, contains, and mitigates incidents.

It applies [Closed loop] and [Zero trust] and relies on [Built-in telemetry]: people and agents analyze each incident from the same signals, preserve the evidence of each compromise, mitigate it under the same controls as any other change, and end it with a fix and a new check (see [NIST SP 800-61]).

### Analyze incidents

Open an issue for each incident, including each suspected compromise, in the repository of the component that it affects, and assign it to the on-call person of the owning team, who leads it as incident commander and brings in the on-call persons of other affected teams.
Analyze each incident with [HolmesGPT], which follows the runbooks of the owning team and reads the signals, state, and recent changes of its environment with read-only access that excludes secrets.
Post its findings to the issue: the affected components, the likely cause and its evidence, and a proposed mitigation.

### Investigate compromises

Quarantine each pod and node that a suspected compromise affects as soon as its issue opens, and keep them running until their evidence is collected.
Collect the artifacts of each quarantined pod and node with [Velociraptor], and store them in immutable storage that the environment's own credentials can't delete.
Build the timeline of each compromise in [Timesketch] from its evidence, the [Falco] alerts, and the audit logs.

### Mitigate incidents

Mitigate each incident through the pipeline, such as by rolling back a component to the image it ran before or by turning off a feature flag.
After a compromise, replace the affected nodes and rotate every secret that the affected components could read.
When a mitigation can't wait for the pipeline, pause the pipeline's sync of the affected namespaces, apply the mitigation directly, and resume the sync once the environment repository declares it.
Review each incident in a blameless postmortem (see [SRE]), and record its timeline, causes, and follow-ups in its issue.
Close each issue when a fix ships together with a new check that would have caught its cause, such as a test, a rule, a policy, or an alert.

## Recover

The recover stage keeps components available and restores their state.

It applies [Closed loop] and relies on [External state] and [Built-in telemetry]: the environment checks the health of every instance, replaces any instance or node at any time, backs up only the state that backing services hold, and tests replacements and restores on a schedule against its objectives.

### Tolerate failures

Run each component in every environment with at least two instances spread across zones, and protect them with a pod disruption budget.
Check each instance with readiness and liveness probes on its health endpoints, and scale each component on its load with a horizontal pod autoscaler.
Inject instance, network, and dependency failures into pre-production on a schedule with [Chaos Mesh], and fix each component that misses its objectives during them.

### Recover environments

Define the recovery point and recovery time objectives of each environment.
Back up the state of each backing service on a schedule that meets the recovery point objective, in-cluster volumes with [Velero] and managed services with their providers' backups, to immutable storage that the environment's own credentials can't delete.
Recover each environment into a new isolated cluster on a schedule: rebuild it from its repositories through the pipeline, restore the latest backups of its backing services into it, and run its smoke tests.
Alert the platform team when a recovery fails or takes longer than the recovery time objective.

## References

Frameworks:

- [NIST CSF][]: cybersecurity outcomes.
- [NIST SP 800-61][]: incident response.
- [SRE][]: reliability engineering.

Standards:

- [OpenID Connect][]: federated identity.
- [SPIFFE][]: workload identity.
- [OpenTelemetry][]: traces, metrics, and logs.

Environment tools:

- [Kubernetes][]: orchestration platform.
- [Istio][]: service mesh.
- [gVisor][]: container sandbox.
- [Falco][]: runtime threat detector.
- [Velero][]: backup and restore tool.
- [Chaos Mesh][]: failure injection platform.

Telemetry tools:

- [OpenTelemetry Collector][]: telemetry pipeline.
- [Prometheus][]: metrics store.
- [Alertmanager][]: alert router.
- [Jaeger][]: trace store.
- [OpenSearch][]: log store.

Incident tools:

- [Velociraptor][]: forensic artifact collector.
- [Timesketch][]: forensic timeline analyzer.
- [HolmesGPT][]: incident analysis agent.

[Zero trust]: ../../principles/devsecops/#zero-trust
[Closed loop]: ../../principles/devsecops/#closed-loop
[Portable package]: ../../principles/cloud-native/#portable-package
[External configuration]: ../../principles/cloud-native/#external-configuration
[Explicit interface]: ../../principles/cloud-native/#explicit-interface
[External state]: ../../principles/cloud-native/#external-state
[Built-in telemetry]: ../../principles/cloud-native/#built-in-telemetry

[NIST CSF]: https://www.nist.gov/cyberframework
[NIST SP 800-61]: https://csrc.nist.gov/pubs/sp/800/61/r3/final
[SRE]: https://sre.google/

[OpenID Connect]: https://openid.net/
[SPIFFE]: https://spiffe.io/
[OpenTelemetry]: https://opentelemetry.io/

[Kubernetes]: https://kubernetes.io/
[Istio]: https://istio.io/
[gVisor]: https://gvisor.dev/
[Falco]: https://falco.org/
[Velero]: https://velero.io/
[Chaos Mesh]: https://chaos-mesh.org/

[OpenTelemetry Collector]: https://opentelemetry.io/docs/collector/
[Prometheus]: https://prometheus.io/
[Alertmanager]: https://prometheus.io/docs/alerting/latest/alertmanager/
[Jaeger]: https://www.jaegertracing.io/
[OpenSearch]: https://opensearch.org/

[Velociraptor]: https://docs.velociraptor.app/
[Timesketch]: https://timesketch.org/
[HolmesGPT]: https://github.com/HolmesGPT/holmesgpt
