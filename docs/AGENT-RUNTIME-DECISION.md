# Agent Runtime Decision: Cloudflare Durable Agents First

**Status:** Proposed; not deployed or connected  
**Date:** 2026-10-28  
**Decision owner:** Project owner  
**Constraint:** $0 out of pocket; no paid plan, no production deployment, no secret or account changes without approval.

## Decision

Evaluate **Cloudflare Workers + the Cloudflare Agents SDK + Durable Objects + Workers AI** as the primary persistent runtime. Keep the existing GitHub repository as the source of truth and GitHub Actions as the validation/review boundary. Do not use the current Vercel sandbox as the production agent host.

Use **LangGraph only if the workflow later needs its graph/checkpoint semantics**; it is an orchestration library, not a solution to the hosting and credentials problem by itself. Do not deploy LangGraph Platform / LangSmith or introduce a paid database, Redis, or hosting service for this $0 project.

Official references:
- Cloudflare Agents: https://developers.cloudflare.com/agents/
- Agents SDK repository: https://github.com/cloudflare/agents
- Workers AI pricing/limits: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Durable Objects pricing/limits: https://developers.cloudflare.com/durable-objects/platform/pricing/
- LangGraph self-hosting: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/concepts/self_hosted.md

## Why the current setup failed

Observed in the existing remote sandbox on 2026-10-28:
- Paperclip health endpoint on port 3100 was unreachable and its log showed database connection failures to 127.0.0.1:54330.
- Ollama had to be restarted and pointed back to its existing model store.
- Hermes had been configured for port 11436 while the Ollama API was listening on 11434. The endpoint was corrected and a backup of its configuration was saved.
- A real Hermes terminal-tool smoke test did not produce verified tool output; the command ultimately exited with code 137.
- The sandbox is not an always-on host. A successful command in it would not establish a durable, externally reachable agent service.

Therefore, do not keep repairing this as the primary architecture. Preserve it as a diagnostic reference, not as the production path.

## Proposed architecture

1. **Cloudflare Worker** — authenticated API entry point and health endpoint.
2. **Cloudflare Agent / Durable Object** — durable identity and SQLite-backed task state; scheduled/recoverable execution instead of relying on a long-lived shell process.
3. **Workers AI binding** — the starter selects `@cf/zai-org/glm-4.7-flash`: official Cloudflare docs list function calling and Workers Free availability. Workers AI has a shared 10,000-Neuron daily free allowance; no paid fallback is configured. Live access still needs testing on the owner's account.
4. **Narrow tools** — explicit, allow-listed repository read, test-result retrieval, and proposal operations. Treat repository text, issues, and model output as untrusted.
5. **GitHub** — source of truth, branches, pull requests, and CI. The agent must not push to `main`, merge, or deploy production.
6. **Human approval gate** — proposals and test evidence first; owner approval before external account connections, production deployment, billing changes, or financial actions.
7. **Observability** — persist task ID, status, timestamps, tool names, bounded inputs/outputs, retry count, model ID, and final verification result. Never log credentials or full secret-bearing environment variables.

## Cost guardrails

- Use Cloudflare's Free plan only. Durable Objects have free daily quotas, and Workers AI has a free daily allocation; quotas are finite and requests can fail after the allowance is exhausted.
- Do not enable a Paid plan, add a payment method, buy AI Gateway credits, or select a model that requires paid billing.
- Add a hard per-task step cap, per-day call budget, request-size limits, and a kill switch.
- Report actual quota/usage evidence where available; never call the service “free forever.”
- GitHub Actions is for bounded CI and patch validation, not the persistent agent loop.

## Staged acceptance tests

### Stage 0 — Account and cost prerequisites
- Confirm an existing Cloudflare account and that Workers Free and Workers AI can be used without upgrading or adding a payment method.
- Confirm the account can deploy a Worker and create SQLite-backed Durable Objects.
- If the account requires a paid plan or billing method for the selected model, stop and select another genuinely free model or report the blocker.

### Stage 1 — Deployable health check
- Build and type-check the Worker locally.
- Deploy only to a new development Worker after explicit owner authorization.
- Verify a public HTTPS health endpoint returns the expected build/version and does not reveal secrets.

### Stage 2 — Durable tool execution
- Submit a uniquely identifiable test task.
- Have the model invoke a harmless deterministic tool (for example, read an allow-listed public repository file and return its SHA).
- Verify the tool ran server-side, not that the model merely printed a plausible result.
- Restart/evict the agent and verify the task record survives and can be resumed or inspected.

### Stage 3 — GitHub read and proposal flow
- Read a known repository file through the authorized integration.
- Produce a bounded patch proposal on an isolated branch or as a review artifact.
- Run syntax, secret-pattern, path allow-list, and repository CI checks.
- Verify a draft PR exists before reporting PR success. Do not merge.

### Stage 4 — Recovery and safety
- Test model errors, invalid tool arguments, timeouts, quota exhaustion, duplicate requests, and retries.
- Verify no automatic merge, production deploy, paid fallback, or financial action is possible.
- Only after all tests pass may this become the primary runtime.

## Implementation status (2026-10-28)\n\nA development-only Worker scaffold now exists at `cloudflare/agent-runtime/`: health endpoint, bearer-protected `/agent` endpoint, strict one-tool allow-list, SQLite Durable Object task persistence, input/model-call validation, Node tests, and Wrangler dry-run CI. The selected model is wired in code but has not been called in a live Cloudflare deployment. CI results must be checked before claiming the current head passes.\n\n## Current blocker / required owner action

The current connected tools can operate on GitHub and Vercel, but there is no Cloudflare account/deployment connector available in this session, and no verified Cloudflare credentials or deployed Worker are available. I can prepare and validate the code and open a review PR, but I cannot honestly claim a Cloudflare deployment or durable runtime until an authorized Cloudflare deployment path is available and the live runtime can be tested.

## Rollback

This proposal is isolated on a feature branch. Do not change the existing Vercel project, production aliases, `main`, or the existing Paperclip/Hermes data while evaluating it. If Cloudflare cannot meet the $0 and recovery tests, close the proposal without deploying and reassess the architecture.
