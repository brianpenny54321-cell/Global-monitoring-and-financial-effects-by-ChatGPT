# Free Local AI Agent

This repository can run a small open-weight coding model on a GitHub-hosted runner. It uses Ollama with `qwen2.5-coder:3b`; model inference does not require a paid model API key. The runner is temporary, so this is task-triggered automation rather than an always-on agent.

## Run it

1. Open or create a GitHub issue describing one concrete improvement and how to verify it.
2. As the repository owner, comment exactly `/agent` on that issue.
3. GitHub Actions downloads the local model, asks it for a bounded code patch, checks the patch and opens a **draft pull request** if the checks pass.
4. Review the diff and Actions checks yourself. Merge and deployment are not performed by the agent.

Workflow: [Free local AI coding agent](../.github/workflows/free-local-agent.yml)

## Guardrails

- No paid inference API or provider API key is required.
- The model has no shell, browser, or repository tools; it only returns a patch.
- Only selected app files and Markdown documentation may be changed. Workflow files, API handlers, deployment configuration and dependencies are blocked.
- Changes are limited to four files and pass patch, path, secret-pattern and basic syntax checks.
- The GitHub token is used by GitHub CLI outside the model prompt and is never sent to Ollama.
- The agent can create draft pull requests only. It cannot merge or deploy.
- Public issue content is untrusted input. Owner-only `/agent` triggering and mandatory human review reduce, but do not eliminate, risks from model-generated code.
- GitHub Actions minutes, runner limits, model download time and local-model quality are constraints. A failed or weak attempt should be treated as a failed attempt, not a completed task.

This is a practical free first agent, not Hermes itself. It creates an autonomous coding path immediately without pretending that Hermes is already installed or connected. A future Hermes adapter can be added independently once a persistent execution environment is authorized and available.
