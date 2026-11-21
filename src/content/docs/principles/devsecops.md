---
title: DevSecOps principles
description: Ship fast and safely with shared ownership and automation at every stage.
sidebar:
  order: 1
---

Ship fast and safely with shared ownership and automation at every stage.

DevSecOps means that each team owns its components across development, security, and operations, and automation applies the controls of all three from commit to production and back (see [CNCF](https://glossary.cncf.io/devsecops/)).
It lets teams ship as often as the business needs, and lets people and agents work under the same controls.

## Everything as code

Define contracts, specifications, infrastructure, pipelines, policies, agent skills, and every other input to delivery as code (see [OpenGitOps](https://opengitops.dev/)).
Keep each one under version control and change it only through review by someone other than its author.
Automation continuously reconciles what runs with the desired state that the repository declares, so nothing drifts from what the code defines.

## Shift left

Shift checks left to people and agents: every check that gives fast feedback runs where the change is made (see [DORA](https://dora.dev/)).
Run deterministic tools with curated rulesets for known issues, and agents with curated instructions and skills for issues that rules can't express.
The pipeline reruns the same checks, so local results predict its verdict.

## Self-service

Offer platform capabilities as self-service: teams provision each one through UIs, CLIs, and APIs rather than tickets (see [CNCF](https://tag-app-delivery.cncf.io/whitepapers/platforms/)).
Raise the level of abstraction from single resources to complete environments, so a team gets everything a change needs in one request.
Each capability comes with its controls built in, so the fastest path is also the safe one.

## Zero trust

Trust no person, pipeline, agent, or artifact by default, whether at build time or at runtime: each proves its identity or provenance, and actors get only short-lived, least-privilege access (see [NIST](https://csrc.nist.gov/pubs/sp/800/207/final)).
Isolate every workload and agent at the machine and network level, so a compromised one can't reach beyond its own scope.
Production accepts only verified artifacts from verified actors, so no one holds standing access that bypasses the pipeline.

## Closed loop

Move each change to production through one automated path, and return production signals and delivery metrics to the team that owns the change (see [SRE](https://sre.google/)).
Integrate checks and monitoring with rollout and rollback, so each stage catches deviations and responds to them.
People and agents detect, analyze, and mitigate incidents and new vulnerabilities under the same controls, and each one ends in a fix and a new check, so it doesn't happen again.
