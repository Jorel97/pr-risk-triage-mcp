#!/usr/bin/env node

const serverInfo = {
  name: "pr-risk-triage-mcp",
  version: "0.1.0",
};

let buffer = "";

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  write({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } });
}

function checklist(args = {}) {
  const title = typeof args.title === "string" ? args.title : "Untitled PR";
  const summary = typeof args.summary === "string" ? args.summary : "";
  const files = Array.isArray(args.changed_files) ? args.changed_files : [];
  const fileText = files.length ? files.map((file) => `- ${file}`).join("\n") : "- No changed files provided";

  return [
    `PR: ${title}`,
    summary ? `Summary: ${summary}` : "Summary: not provided",
    "",
    "Changed files:",
    fileText,
    "",
    "Risk triage checklist:",
    "1. Correctness: identify changed behavior, edge cases, and expected invariants.",
    "2. Data safety: check deletes, migrations, retries, idempotency, and partial failures.",
    "3. Security/privacy: check auth, permissions, input validation, secret handling, and logging.",
    "4. Compatibility: check API shape, config defaults, serialization, and old-client behavior.",
    "5. Tests: require focused regression tests for every high-risk behavior change.",
    "6. Operations: check observability, rollback path, rate limits, and failure messages.",
    "",
    "Verdict rule:",
    "- block: exploitable, data-loss, broken core behavior, or untested critical path.",
    "- needs follow-up: behavior is likely correct but tests/docs/migration coverage is incomplete.",
    "- ready: risks are understood, tested, and limited.",
  ].join("\n");
}

function handle(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    return result(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo,
    });
  }

  if (method === "tools/list") {
    return result(id, {
      tools: [
        {
          name: "pr_risk_triage_checklist",
          description: "Return a practical pull-request risk triage checklist.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              changed_files: { type: "array", items: { type: "string" } },
            },
            required: ["title"],
          },
        },
      ],
    });
  }

  if (method === "tools/call") {
    const name = params?.name;
    if (name !== "pr_risk_triage_checklist") {
      return error(id, -32602, `Unknown tool: ${name}`);
    }
    return result(id, {
      content: [{ type: "text", text: checklist(params?.arguments) }],
    });
  }

  if (method === "notifications/initialized") {
    return;
  }

  return error(id, -32601, `Method not found: ${method}`);
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch (err) {
      error(null, -32700, err instanceof Error ? err.message : "Parse error");
    }
  }
});

