---
title: Cloud native principles
description: Scale delivery with components that pipelines deliver and environments run the same way.
sidebar:
  order: 2
---

Scale delivery with components that pipelines deliver and environments run the same way.

Cloud native means designing software around the following assumptions: components are independent, environments are automated, infrastructure is replaceable, and shared capabilities are available (see [CNCF](https://www.cncf.io/about/who-we-are/)).
It lets teams deliver every component through the same pipelines, policies, and controls.

## Portable package

Each component ships as a self-contained package that runs in any compatible environment without changes (see [OCI](https://opencontainers.org/)).
The pipeline builds the package once and promotes it through every environment, so production runs exactly what was tested.

## External configuration

Each component reads environment-specific configuration from outside the package and gets its identity and credentials from the environment at runtime.
The package contains no secrets, so anyone can scan, store, and share it without exposing credentials.

## Explicit interface

Each component exposes and consumes capabilities through explicit, well-defined interfaces rather than through implicit knowledge of other components (see [OpenAPI](https://openapis.org/)).
Explicit interfaces let teams test contracts, enforce access policies at the boundary, and keep changes backward compatible, so each component deploys and rolls back independently.

## External state

Each component keeps persistent and shared state in backing services that the platform provides.
Instances start fast and shut down gracefully, so the environment can scale, update, and replace them at any time without losing work.

## Built-in telemetry

Each component reports its health and emits logs, metrics, and traces in standard formats (see [OpenTelemetry](https://opentelemetry.io/)).
The environment operates every component the same way, and teams see how each change behaves in production.
