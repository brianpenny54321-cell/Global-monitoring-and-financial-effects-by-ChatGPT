# Implementation Roadmap

## Current deployed slice
- [x] Requirements and architecture documentation.
- [x] Dashboard UI and responsive layout.
- [x] Health endpoint for the deployed web service.
- [x] Structured proposal form that opens a prefilled GitHub issue.
- [x] Issue template and repository validation workflow.
- [ ] Automated AI-provider adapters.
- [ ] Durable agent execution service and storage.
- [ ] Per-platform deployment adapters and integration tests.

## Phase 1 — Secure collaboration
Use issues for proposals and pull requests for code changes. Require appropriate review and automated checks. Record test evidence and deployment identifiers.

## Phase 2 — First AI adapter
Select a provider and authorized connection method. Document scopes, credential storage, supported actions, failure handling, and tests. Never expose credentials to browser-side JavaScript.

## Phase 3 — Controlled agent execution
Run proposed work in an isolated, resource-limited environment. Give agents scoped credentials, treat model output as untrusted, and require approval for sensitive actions. Add timeouts, budgets, audit logs, and rollback.

## Phase 4 — Multi-platform delivery
Maintain separate deployment configuration for each target. Run target-specific smoke tests and record each result independently.

## Definition of done
A feature is complete only when implemented, automated checks pass, intended behavior is tested, and deployment is independently verified. A roadmap item or UI label is not evidence that an integration is connected.
