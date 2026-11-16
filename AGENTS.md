# Agent instructions

See [README.md](README.md) for the content layout and how to build the site.

## Vision

The guide is for senior engineers and above who build DevSecOps in their organizations. It is a starting point, not a complete reference: it skips basics its readers know, and picks one option where the industry offers several. It includes only approaches and tools that major companies adopt and document.

## Content

### Model

The guide builds on one model of delivery. Teams own components and their changes. Teams consist of people and agents, who make and review changes under the same controls. Teams deliver components through pipelines, which deploy them to environments. Pipelines and environments run on infrastructure, which consists of resources.

### Principles

The guide rests on two sets of principles: the DevSecOps principles describe how software is delivered and run, and the cloud native principles describe what a component does so the platform can run it.

Keep each set small and each principle memorable: five principles per set, each with a short name. When a set misses something important, don't add a principle. Either broaden an existing one to cover it, or replace the least important one with the new one.

Each principle may link to one source that broadly supports it. Detailed references belong on the pages that cover the topic in depth.

### Practices

Practices apply the principles to one part of the model. Each practice consists of stages, and each stage consists of steps: the actions that the guide prefers to apply or follow. A step consists only of concrete actions, without reasons or outcomes. A step combines the actions that serve one purpose, so a stage has a few substantial steps rather than many small ones.

Practices balance a grounded path against readability. Keep a detail only if leaving it out would misdirect the reader, and leave mechanisms, edge cases, and hardening for the reader to work out.

### Sources

Name and link only industry-wide FOSS tools, open standards, guides and frameworks from standards bodies and foundations. Don't link to opinionated guides or blogs, however well known they are.
