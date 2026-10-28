# AI Platform Integration Checklist

This is a planning checklist, not a claim that any integration is already connected.

## For each platform

- [ ] Name the platform and intended capability.
- [ ] Confirm an official or otherwise authorized integration path exists.
- [ ] Confirm what it can actually do: read, propose edits, open PRs, run tests, deploy.
- [ ] Grant least-privilege repository permissions.
- [ ] Store provider credentials only in the platform's secret manager.
- [ ] Keep provider-specific code in its own adapter.
- [ ] Define timeouts, rate limits, failure handling, and data-retention behavior.
- [ ] Require review for sensitive or production-impacting changes.
- [ ] Test read access using a non-sensitive file.
- [ ] Test a harmless change on a branch, then verify the PR and CI result.
- [ ] Document limitations and the date/results of verification.

## Capability rule

Do not claim that an AI can “see,” “edit,” “deploy,” or “coordinate with” another platform unless the corresponding authorized integration and action have been tested. Sharing a Git repository makes code available to authorized integrations; it does not by itself connect models to each other.
