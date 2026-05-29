# PR Risk Triage MCP

A tiny stdio MCP server for coding agents that need a repeatable pull-request
risk checklist.

It exposes one tool:

- `pr_risk_triage_checklist`: returns a severity-oriented review checklist for
  a PR title, optional summary, and changed-file list.

The server is intentionally dependency-free so it can run anywhere Node.js is
available.

## Run

```bash
node server.mjs
```

## MCP Client Config

```json
{
  "mcpServers": {
    "pr-risk-triage": {
      "command": "node",
      "args": ["/absolute/path/to/pr-risk-triage-mcp/server.mjs"]
    }
  }
}
```

## Tool Input

```json
{
  "title": "Fix invoice retry handling",
  "summary": "Adds retry and idempotency handling to invoice webhooks.",
  "changed_files": ["src/api/invoices.ts", "src/api/invoices.test.ts"]
}
```

## License

MIT

