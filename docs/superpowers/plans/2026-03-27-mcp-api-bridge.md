# TodoFlow MCP API Bridge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone MCP server that exposes TodoFlow API operations as explicit tools for Claude Code.

**Architecture:** Add a new `mcp/` adapter layer that validates tool inputs, forwards requests to existing Next.js API routes on `http://localhost:3916`, normalizes errors, and blocks write operations when auth is enabled (no-login mode). Keep business logic in existing API routes.

**Tech Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, existing project scripts (`tsx`).

---

### Task 1: Scaffold MCP runtime and shared client

**Files:**
- Create: `mcp/server.ts`
- Create: `mcp/lib/env.ts`
- Create: `mcp/lib/http.ts`
- Create: `mcp/lib/result.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for API forwarding and error mapping**
- [ ] **Step 2: Run tests and verify failure**
- [ ] **Step 3: Implement shared env/http/result helpers minimally**
- [ ] **Step 4: Re-run tests and verify pass**
- [ ] **Step 5: Commit checkpoint**

### Task 2: Add Todo and Tag MCP tools

**Files:**
- Create: `mcp/tools/todos.ts`
- Create: `mcp/tools/tags.ts`
- Modify: `mcp/server.ts`

- [ ] **Step 1: Write failing tests for todo/tag tool behavior boundaries**
- [ ] **Step 2: Run tests and verify failure**
- [ ] **Step 3: Implement todo/tag tools with strict input schema**
- [ ] **Step 4: Re-run tests and verify pass**
- [ ] **Step 5: Commit checkpoint**

### Task 3: Add Settings/Reminder/Auth tools + docs

**Files:**
- Create: `mcp/tools/settings.ts`
- Create: `mcp/tools/reminders.ts`
- Create: `mcp/tools/auth.ts`
- Create: `mcp/README.md`
- Modify: `mcp/server.ts`

- [ ] **Step 1: Write failing tests for auth guard + endpoint mapping**
- [ ] **Step 2: Run tests and verify failure**
- [ ] **Step 3: Implement remaining tools and wire registration**
- [ ] **Step 4: Re-run tests and verify pass**
- [ ] **Step 5: Document setup and usage**

### Task 4: Verify end-to-end commands

**Files:**
- Modify: `package.json`
- Test: `mcp/**/*.test.ts`

- [ ] **Step 1: Run MCP test suite**
- [ ] **Step 2: Run existing server tests to confirm no regressions**
- [ ] **Step 3: Smoke check `npm run mcp:start`**
- [ ] **Step 4: Summarize verification evidence**
