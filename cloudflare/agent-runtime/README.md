# Cloudflare Agent Runtime Starter

## What exists in this branch

This is a **development scaffold**, not a deployed service.

- `GET /health`: reports a small, non-secret health/build response.
- `POST /tasks`: accepts a bounded deterministic task only when a development-only `AGENT_API_TOKEN` secret is configured.\n- `POST /agent`: asks Workers AI to call the single allow-listed tool and validates the model's function call before execution; requires the same bearer token and Workers AI binding.
- `GET /tasks?taskId=...`: reads a task record after authentication.
- SQLite-backed Durable Object: stores task status and the deterministic tool result.
- Initial allow-listed tool: `sha256_text`, a harmless server-side SHA-256 operation.
- Input validation, idempotent task IDs, output limits, model-call validation tests, and a CI dry-run build check.

The bounded `/agent` endpoint now uses Cloudflare Workers AI model `@cf/zai-org/glm-4.7-flash`. I selected it because Cloudflare's current official model docs identify it as supporting function calling, and Cloudflare's current pricing/model-access docs list it among models available on the Workers Free plan. Workers AI has a shared 10,000-Neuron daily free allocation; requests fail if the free quota is exhausted, and this code has no paid fallback. This is a code-level selection, not proof that the owner's Cloudflare account is configured or that a live call has succeeded. The model can request only `sha256_text`; the server validates the function name, JSON arguments, exact input, and input size before executing it. No shell, arbitrary URL, repository write, or financial tool is exposed.

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
