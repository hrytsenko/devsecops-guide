# Agent instructions

See [README.md](README.md) for the content layout and how to build the site.

## Vision

The guide is for senior engineers and above who build DevSecOps in their organizations. It is a starting point, not a complete reference: it skips basics its readers know, and picks one option where the industry offers several. It includes only approaches and tools that major companies adopt and document.

## Content

### Model

The guide builds on one model of delivery. Teams consist of people and agents, who make and review changes under the same controls. Each team owns its components and their changes, and delivers them through pipelines, which deploy them to environments. The platform team owns the platform, which provides pipelines and environments to every team and runs them on shared infrastructure.

### Principles

The guide rests on two sets of principles: the DevSecOps principles describe how software is delivered and run, and the cloud native principles describe what a component does so the platform can run it.

Keep each set small and each principle memorable: five principles per set, each with a short name. When a set misses something important, don't add a principle. Either broaden an existing one to cover it, or replace the least important one with the new one.

Each principle may link to one source that broadly supports it. Detailed references belong on the pages that cover the topic in depth.

### Practices

Practices apply the principles to one part of the model. Each practice consists of stages, and each stage consists of steps: the actions that the guide prefers to apply or follow. A step consists only of concrete actions, without reasons or outcomes. Each step is backed by tools, standards, or processes that frameworks define, so the guide doesn't invent steps of its own. A step combines the actions that serve one purpose, so a stage has a few substantial steps rather than many small ones. A practice opens with the foundations that every stage relies on, each a short declarative paragraph that ends with the trade-off of the simpler alternative.

Each practice applies the DevSecOps principles that its steps carry out, and relies on the cloud native principles that its steps depend on. Its intro lists the principles it applies, each in one lean clause, and each stage names the principles it applies and relies on. A practice leaves out a principle that only another practice carries out, rather than stretching it to fit.

Each practice reads on its own, and each concept belongs to one practice. Practices don't link to each other, and a practice uses a concept of another one only for what it provides, without restating it.

Practices balance a grounded path against readability. Keep a detail only if leaving it out would misdirect the reader, and leave mechanisms, edge cases, and hardening for the reader to work out.

### Sources

Name and link only industry-wide FOSS tools, open standards, frameworks, and guides. A framework or guide qualifies when an organization, such as a standards body, a foundation, or a company, publishes it openly and maintains it. Don't link to guides or blogs of individual authors, or to marketing content, however well known they are.

When you name a feature, resource, or subproject together with its tool, link the tool and write the rest in prose, such as [Istio] CNI agent, [Tekton] chains controller, or [Kubernetes] network policies. A subproject with a name of its own, such as Alertmanager in Prometheus or Cosign in Sigstore, keeps its own link.
