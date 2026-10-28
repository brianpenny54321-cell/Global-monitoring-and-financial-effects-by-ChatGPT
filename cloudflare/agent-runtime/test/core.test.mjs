import test from "node:test";
import assert from "node:assert/strict";
import { isValidTaskId, validateTask, runAllowlistedTool } from "../src/core.mjs";

test("accepts bounded safe task IDs", () => {
  assert.equal(isValidTaskId("smoke-test_01"), true);
  assert.equal(isValidTaskId("../secrets"), false);
  assert.equal(isValidTaskId(""), false);
  assert.equal(isValidTaskId("x".repeat(81)), false);
});

test("accepts only the allow-listed deterministic tool", () => {
  assert.equal(validateTask({ taskId: "t1", tool: "sha256_text", input: "hello" }).ok, true);
  assert.equal(validateTask({ taskId: "t1", tool: "shell", input: "whoami" }).ok, false);
  assert.equal(validateTask({ taskId: "t1", tool: "sha256_text", input: "x".repeat(4097) }).ok, false);
  assert.equal(validateTask([]).ok, false);
});

test("runs SHA-256 tool and returns verifiable output", async () => {
  const result = await runAllowlistedTool("sha256_text", "hello");
  assert.equal(result.sha256, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  assert.equal(result.inputLength, 5);
  await assert.rejects(() => runAllowlistedTool("shell", "echo unsafe"));
});
