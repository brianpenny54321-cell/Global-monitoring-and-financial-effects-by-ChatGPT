import { DurableObject } from "cloudflare:workers";
import { jsonResponse, runAllowlistedTool, validateAgentTask, validateTask, extractSha256ToolCall } from "./core.mjs";

const BUILD_ID = "cloudflare-agent-runtime-v1";

function isAuthorized(request, env) {
  const expected = env.AGENT_API_TOKEN;
  if (typeof expected !== "string" || expected.length < 32) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export class TaskAgent extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        input TEXT NOT NULL,
        result_json TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/task") {
      const taskId = url.searchParams.get("taskId");
      const row = this.ctx.storage.sql.exec(
        "SELECT task_id, status, tool_name, result_json, error, created_at, updated_at FROM tasks WHERE task_id = ?",
        taskId,
      ).toArray()[0];
      if (!row) return jsonResponse({ error: "Task not found." }, 404);
      return jsonResponse({ task: { ...row, result: row.result_json ? JSON.parse(row.result_json) : null, result_json: undefined } });
    }

    if (request.method !== "POST" || url.pathname !== "/task") {
      return jsonResponse({ error: "Not found." }, 404);
    }

    let body;
    try { body = await request.json(); } catch { return jsonResponse({ error: "Body must be valid JSON." }, 400); }
    const validation = validateTask(body);
    if (!validation.ok) return jsonResponse({ error: validation.error }, 400);

    const task = validation.value;
    const existing = this.ctx.storage.sql.exec(
      "SELECT task_id, status, tool_name, result_json, error, created_at, updated_at FROM tasks WHERE task_id = ?",
      task.taskId,
    ).toArray()[0];
    if (existing) return jsonResponse({ task: { ...existing, result: existing.result_json ? JSON.parse(existing.result_json) : null, result_json: undefined }, idempotentReplay: true });

    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      "INSERT INTO tasks (task_id, status, tool_name, input, created_at, updated_at) VALUES (?, 'running', ?, ?, ?, ?)",
      task.taskId, task.tool, task.input, now, now,
    );

    try {
      const result = await runAllowlistedTool(task.tool, task.input);
      const updated = new Date().toISOString();
      this.ctx.storage.sql.exec(
        "UPDATE tasks SET status = 'succeeded', result_json = ?, updated_at = ? WHERE task_id = ?",
        JSON.stringify(result), updated, task.taskId,
      );
      return jsonResponse({ task: { taskId: task.taskId, status: "succeeded", tool: task.tool, result, createdAt: now, updatedAt: updated } }, 201);
    } catch (error) {
      const updated = new Date().toISOString();
      this.ctx.storage.sql.exec(
        "UPDATE tasks SET status = 'failed', error = ?, updated_at = ? WHERE task_id = ?",
        "Tool execution failed.", updated, task.taskId,
      );
      return jsonResponse({ task: { taskId: task.taskId, status: "failed", createdAt: now, updatedAt: updated } }, 500);
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "global-monitoring-agent-runtime", build: BUILD_ID, deployment: "unverified-until-deployed" });
    }
    if (url.pathname === "/tasks" && !isAuthorized(request, env)) {
      return jsonResponse({ error: "Unauthorized. Configure a development-only AGENT_API_TOKEN secret before using task endpoints." }, 401, { "www-authenticate": "Bearer" });
    }
    if (url.pathname === "/tasks" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return jsonResponse({ error: "Body must be valid JSON." }, 400); }
      const validation = validateTask(body);
      if (!validation.ok) return jsonResponse({ error: validation.error }, 400);
      const stub = env.TASKS.get(env.TASKS.idFromName(validation.value.taskId));
      return stub.fetch("https://task-agent.internal/task", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation.value),
      });
    }
    if (url.pathname === "/tasks" && request.method === "GET") {
      const taskId = url.searchParams.get("taskId");
      if (!taskId) return jsonResponse({ error: "taskId query parameter is required." }, 400);
      const stub = env.TASKS.get(env.TASKS.idFromName(taskId));
      return stub.fetch(`https://task-agent.internal/task?taskId=${encodeURIComponent(taskId)}`);
    }

    if (url.pathname === "/agent" && !isAuthorized(request, env)) {
      return jsonResponse({ error: "Unauthorized. Configure a development-only AGENT_API_TOKEN secret before using agent endpoints." }, 401, { "www-authenticate": "Bearer" });
    }
    if (url.pathname === "/agent" && request.method === "POST") {
      if (!env.AI || typeof env.AI.run !== "function") {
        return jsonResponse({ error: "Workers AI binding is not configured." }, 503);
      }
      let body;
      try { body = await request.json(); } catch { return jsonResponse({ error: "Body must be valid JSON." }, 400); }
      const validation = validateAgentTask(body);
      if (!validation.ok) return jsonResponse({ error: validation.error }, 400);
      const task = validation.value;
      let modelResponse;
      try {
        modelResponse = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          messages: [
            { role: "system", content: "You are a constrained tool-using agent. You must call the provided sha256_text tool exactly once, passing the input string exactly as provided by the user. Never invent or alter the input. Do not request other tools." },
            { role: "user", content: JSON.stringify({ instruction: task.instruction, input: task.input }) }
          ],
          tools: [{
            type: "function",
            function: {
              name: "sha256_text",
              description: "Compute SHA-256 of the exact supplied input string. This tool has no external side effects.",
              parameters: {
                type: "object",
                properties: { text: { type: "string", maxLength: 4096 } },
                required: ["text"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: "required",
          parallel_tool_calls: false,
          max_tokens: 128,
          temperature: 0
        });
      } catch {
        return jsonResponse({ error: "Workers AI request failed. Check free-tier availability and model access; no paid fallback is configured." }, 503);
      }
      const selected = extractSha256ToolCall(modelResponse, task.input);
      if (!selected.ok) return jsonResponse({ error: selected.error, model: "@cf/zai-org/glm-4.7-flash" }, 502);
      const stub = env.TASKS.get(env.TASKS.idFromName(task.taskId));
      const result = await stub.fetch("https://task-agent.internal/task", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: task.taskId, tool: selected.value.tool, input: selected.value.input })
      });
      const payload = await result.json();
      if (!result.ok) return jsonResponse({ error: payload.error || "Tool execution failed.", task: payload.task }, result.status);
      return jsonResponse({
        task: payload.task,
        agent: { model: "@cf/zai-org/glm-4.7-flash", toolCallValidated: true }
      }, result.status);
    }
    return jsonResponse({ error: "Not found." }, 404);
  },
};
