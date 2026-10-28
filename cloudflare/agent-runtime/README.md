# Cloudflare Agent Runtime Starter

## What exists in this branch

This is a **development scaffold**, not a deployed service.

- `GET /health`: reports a small, non-secret health/build response.
- `POST /tasks`: accepts a bounded task only when a development-only `AGENT_API_TOKEN` secret is configured.
- `GET /tasks?taskId=...`: reads a task record after authentication.
- SQLite-backed Durable Object: stores task status and the deterministic tool result.
- Initial allow-listed tool: `sha256_text`, a harmless server-side SHA-256 operation.
- Input validation, idempotent task IDs, output limits, Node tests, and a CI dry-run build check.

The model is deliberately **not enabled yet**. That is a safety and reliability choice, not a request for the owner to pick one: first validate the runtime and durable tool boundary, then select the best model that is actually available on the existing account's free allowance and supports tool calling. A model must never be allowed to choose arbitrary shell commands or bypass the allow-list.

## Local validation

From this directory:

```sh
npm install
npm test
npm run check
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

The GitHub Actions workflow runs these checks on relevant pull requests. A passing dry run proves bundle/config validity only; it does not prove a live Cloudflare deployment.

## Development-only setup

1. Confirm the existing Cloudflare account can use Workers Free, SQLite-backed Durable Objects, and a suitable Workers AI model without upgrading or adding a payment method.
2. Create a long random development token in Cloudflare's secret manager as `AGENT_API_TOKEN`; never commit it or paste it into chat.
3. Deploy only to a new development Worker after the owner explicitly authorizes deployment.
4. Test health, authenticated tool execution, persisted task retrieval, duplicate task handling, and invalid inputs.
5. Confirm the task survives a later request/instance eviction before calling durability verified.

Do not deploy production, add billing, or connect a GitHub write token as part of this starter. The first version has no GitHub write integration, no arbitrary command execution, and no autonomous merge/deploy capability.

## Status and limits

- Deployment: not performed.
- Live endpoint: none verified.
- Durable storage: implemented in code, not yet tested against a live Cloudflare Durable Object.
- Model/tool-calling: intentionally deferred until free-tier eligibility and tool-call behavior are verified.
- CI: workflow added; results must be read from GitHub Actions before claiming tests passed.
