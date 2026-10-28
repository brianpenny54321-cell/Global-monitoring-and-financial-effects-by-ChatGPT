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
