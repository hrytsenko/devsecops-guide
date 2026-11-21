# DevSecOps Guide

An opinionated guide for senior engineers who build DevSecOps in their organizations.

Published at [DevSecOps Guide](https://hrytsenko.github.io/devsecops-guide/).

## Content

```text
src/content/docs/
  index.mdx          # delivery model that every page follows
  principles/        # what every practice rests on
    devsecops.md     # how teams deliver and run software
    cloud-native.md  # what a component does so the platform can run it
  practices/         # stages of concrete steps that rely on the principles
    components.md    # from assessment to authorization
    pipelines.md     # from commit to release
    environments.md  # from isolation to recovery
    platform.md      # from offering to evolution
```

## Develop

```sh
npm install
npm run dev                 # run at http://localhost:4321/devsecops-guide/
pre-commit install          # install hooks
pre-commit run --all-files  # run hooks
```
