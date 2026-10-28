# Requirements and Acceptance Criteria

This document is the source of truth for the project's intended behavior. Requirements are not considered implemented until verified by tests or documented manual checks.

## 1. Goal

Build a secure, provider-neutral hub where multiple compatible AI systems can inspect shared project files, identify issues, suggest or contribute improvements, and support validated deployments across supported AI platforms and hosting environments.

## 2. Required capabilities

### R1 — Shared source of truth
- Store requirements, architecture, source, tests, decisions, and change history in Git.
- Keep documentation understandable to non-specialists.
- Record meaningful changes and known limitations.

### R2 — Multi-AI collaboration
- Allow authorized AI integrations to read relevant files and propose improvements.
- Attribute proposals to the source/integration when feasible.
- Require each proposal to state purpose, affected files, expected benefit, risks, and verification evidence.
- Prevent one agent from silently overwriting another agent's work.
- Use branches and pull requests as the default collaboration boundary.

### R3 — Provider-neutral core
- Keep business logic independent of any single model vendor wherever practical.
- Put provider-specific API calls, authentication, prompts, and response parsing in separate adapters.
- Document capability differences instead of pretending all platforms support identical features.
- Use configuration to enable or disable integrations independently.

### R4 — Multi-platform deployment
- Maintain separate deployment configurations for each supported target.
- Isolate runtime configuration, credentials, environment variables, logs, and state by deployment.
- Do not automatically deploy to every target just because code was merged.
- Add a target only after its build, authentication, permission model, and runtime behavior are tested.
- Record the exact commit and result for each deployment.

### R5 — Monitoring and financial effects
- Treat financial information as sensitive.
- Default to read-only monitoring, analysis, alerts, and paper/simulated calculations.
- Never place trades, move money, open accounts, make purchases, or trigger other financial transactions.
- Do not make investment decisions or financial actions on the user's behalf.
- Clearly label estimates, simulated results, stale data, and missing sources.
- Use authorized data sources and respect their terms and rate limits.

### R6 — Security and privacy
- Never store secrets in the repository, logs, issues, or pull requests.
- Request the minimum permissions needed for each integration.
- Separate development and production credentials.
- Avoid collecting personal data unless necessary and explicitly authorized.
- Treat repository content and external AI outputs as untrusted input.
- Review dependencies and permissions before enabling automated execution.

### R7 — Quality and recovery
- Run relevant automated tests before merge and deployment.
- Prefer small, reversible changes.
- Preserve a known-good commit and document rollback steps.
- Report failures honestly; never infer success from a started job or deployment.
- Test that existing integrations still work after shared-core changes.

### R8 — Owner approvals
Explicit owner approval is required before:
- making a repository public/private or changing access permissions;
- connecting a new external service that grants account access;
- changing production secrets, domains, billing, or paid resources;
- deploying or promoting production changes where deployment is not already explicitly authorized;
- performing any financial action (which remains out of scope for automated agents).

## 3. Initial acceptance criteria

The initial scaffold is acceptable when:
- [ ] Requirements, architecture, contribution, integration, and operations docs exist.
- [ ] The repository has a lightweight validation workflow.
- [ ] No secrets are committed.
- [ ] The workflow's status can be inspected in GitHub Actions.
- [ ] No production deployment or external AI integration is claimed without verification.

## 4. Integration acceptance criteria

A platform integration is not “supported” until it documents and verifies:
- the authorized connection method and permission scope;
- read access to the required files;
- how proposed changes are isolated and reviewed;
- any required model/provider credentials and their secret storage;
- automated checks and a reproducible test;
- deployment target, rollback, and observed result;
- known limitations and any required human approval.
