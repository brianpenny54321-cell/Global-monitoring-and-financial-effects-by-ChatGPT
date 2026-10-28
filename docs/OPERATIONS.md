# Operations: Validation, Deployment, and Recovery

## Before merge
- Review the diff and the requirement being changed.
- Run the available automated checks.
- Check for secrets, unexpected file deletion, permission changes, and unrelated edits.
- Record failures; do not conceal or bypass them.

## Before deployment
- Confirm the exact commit to deploy.
- Confirm the intended target and environment.
- Confirm required environment variables exist in the target's secret manager.
- Confirm the deployment is authorized and does not unexpectedly incur cost.
- Ensure a known-good deployment/commit can be restored.

## After deployment
A deployment is verified only after the platform reports a successful state and the deployed application or endpoint has been tested. A created deployment, queued job, or build-in-progress is not success.

Record:
- platform and project;
- commit SHA;
- deployment identifier/URL;
- reported state;
- smoke-test result and timestamp;
- known failures or limitations.

## Rollback
1. Stop further promotions if a regression is suspected.
2. Identify the last known-good commit/deployment.
3. Use the hosting platform's supported rollback or redeploy procedure.
4. Verify the restored target with the same smoke tests.
5. Document the cause and corrective action.

## Financial safety
Monitoring and paper calculations must remain separate from real financial execution. Do not add trading, transfers, or payment functionality as a routine improvement.
