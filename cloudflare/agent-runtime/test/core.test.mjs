import test from "node:test";
import assert from "node:assert/strict";
import { isValidTaskId, validateTask, validateAgentTask, extractSha256ToolCall, runAllowlistedTool } from "../src/core.mjs";

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

test("validates agent task boundaries", () => {
  assert.equal(validateAgentTask({ taskId: "agent-1", instruction: "Hash the provided input", input: "hello" }).ok, true);
  assert.equal(validateAgentTask({ taskId: "agent-1", instruction: "", input: "hello" }).ok, false);
  assert.equal(validateAgentTask({ taskId: "agent-1", instruction: "x", input: "x".repeat(4097) }).ok, false);
});

test("accepts only the expected model tool call and exact input", () => {
  const response = { choices: [{ message: { tool_calls: [{
    type: "function",
    function: { name: "sha256_text", arguments: JSON.stringify({ text: "hello" }) }
  }] } }] };
  assert.equal(extractSha256ToolCall(response, "hello").ok, true);
  assert.equal(extractSha256ToolCall(response, "different").ok, false);
  const unsafe = structuredClone(response);
  unsafe.choices[0].message.tool_calls[0].function.name = "shell";
  assert.equal(extractSha256ToolCall(unsafe, "hello").ok, false);
  assert.equal(extractSha256ToolCall({ choices: [{ message: { tool_calls: [] } }] }, "hello").ok, false);
});
