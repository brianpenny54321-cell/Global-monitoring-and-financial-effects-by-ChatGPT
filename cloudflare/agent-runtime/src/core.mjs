export const MAX_TASK_ID_LENGTH = 80;
export const MAX_INPUT_LENGTH = 4096;

export function isValidTaskId(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_TASK_ID_LENGTH &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value);
}

export function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  if (!isValidTaskId(body.taskId)) {
    return { ok: false, error: "taskId must be 1-80 safe characters." };
  }
  if (body.tool !== "sha256_text") {
    return { ok: false, error: "Tool is not allow-listed. Allowed tool: sha256_text." };
  }
  if (typeof body.input !== "string" || body.input.length > MAX_INPUT_LENGTH) {
    return { ok: false, error: "input must be a string of at most 4096 characters." };
  }
  return { ok: true, value: { taskId: body.taskId, tool: body.tool, input: body.input } };
}

export async function runAllowlistedTool(tool, input) {
  if (tool !== "sha256_text") {
    throw new Error("Tool is not allow-listed.");
  }
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { tool, inputLength: bytes.length, sha256: hex };
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

export function validateAgentTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  if (!isValidTaskId(body.taskId)) {
    return { ok: false, error: "taskId must be 1-80 safe characters." };
  }
  if (typeof body.instruction !== "string" || body.instruction.trim().length < 1 || body.instruction.length > 1000) {
    return { ok: false, error: "instruction must contain 1-1000 characters." };
  }
  if (typeof body.input !== "string" || body.input.length > MAX_INPUT_LENGTH) {
    return { ok: false, error: "input must be a string of at most 4096 characters." };
  }
  return { ok: true, value: { taskId: body.taskId, instruction: body.instruction, input: body.input } };
}

export function extractSha256ToolCall(response, expectedInput) {
  const calls = response?.choices?.[0]?.message?.tool_calls;
  if (!Array.isArray(calls) || calls.length !== 1) {
    return { ok: false, error: "Model did not return exactly one tool call." };
  }
  const call = calls[0];
  if (call?.type !== "function" || call?.function?.name !== "sha256_text") {
    return { ok: false, error: "Model requested a tool that is not allow-listed." };
  }
  let args;
  try {
    args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments;
  } catch {
    return { ok: false, error: "Model returned invalid tool arguments." };
  }
  if (!args || typeof args.text !== "string" || args.text !== expectedInput || args.text.length > MAX_INPUT_LENGTH) {
    return { ok: false, error: "Model tool arguments failed validation." };
  }
  return { ok: true, value: { tool: "sha256_text", input: args.text } };
}
