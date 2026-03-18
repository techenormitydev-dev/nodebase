# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Mindflow** — a visual workflow automation SaaS (AI-native Zapier/Make alternative). Users build automations by connecting trigger and action nodes on a drag-and-drop canvas. Workflows execute reliably in the background via Inngest with real-time status updates.

## Commands

```bash
# Start everything (Next.js + Inngest dev server + ngrok)
npm run dev:all

# Start only Next.js
npm run dev

# Start only Inngest dev server (required for workflow execution)
npm run inngest:dev

# Lint (uses Biome, not ESLint)
npm run lint

# Format
npm run format

# Run DB migrations
npx prisma migrate dev

# Generate Prisma client after schema changes
npx prisma generate

# Build
npm run build
```

There are no tests in this project.

## Architecture

### Execution Flow

When a workflow runs, this is the exact path:

1. A trigger fires → `sendWorkflowExecution()` sends a `workflows/execute.workflow` event to Inngest
2. `executeWorkflow` Inngest function (`src/inngest/functions.ts`) picks it up
3. Nodes are fetched from DB and sorted with `topologicalSort` (toposort library)
4. Each node is executed in order via `getExecutor(node.type)` from `executor-registry.ts`
5. Each executor receives `{ data, nodeId, userId, context, step, publish }` and returns an updated `context`
6. `context` is a plain `Record<string, unknown>` that accumulates across all nodes — each node writes its output to `context[variableName]`
7. Conditional nodes additionally record which branch was taken in `conditionalBranches` map, skipping unreachable downstream nodes
8. Real-time status (loading/success/error) is streamed to the editor via `publish()` and Inngest Realtime channels

### Adding a New Node

Every node type requires **4 files** following the same pattern:

```
src/features/executions/components/<name>/
  dialog.tsx    — React form (Radix Dialog + React Hook Form + Zod)
  node.tsx      — React Flow node component (uses BaseExecutionNode or custom)
  executor.ts   — Server-side logic, receives context, returns updated context
  actions.ts    — Server actions (e.g. fetching realtime tokens)
```

After creating these files, register the node in **two places**:
- `src/config/node-components.ts` — maps `NodeType` enum → React component (for the editor canvas)
- `src/features/executions/lib/executor-registry.ts` — maps `NodeType` enum → executor function (for runtime)

Also add the `NodeType` enum value to `prisma/schema.prisma` and run `prisma migrate dev`.

### Executor Contract

```ts
type NodeExecutor<TData> = (params: NodeExecutorParams<TData>) => Promise<WorkflowContext>;
```

- Always call `publish(channel().status({ nodeId, status: "loading" }))` at the start
- Always call `publish(channel().status({ nodeId, status: "success" | "error" }))` before returning/throwing
- Use `step.run("step-name", async () => {...})` for any DB/network calls (Inngest durability)
- Use `step.ai.wrap(...)` for AI calls (enables Sentry + Inngest tracing)
- Throw `NonRetriableError` for config errors (missing fields), plain `Error` for retriable failures
- Template variables with `Handlebars.compile(template)(context)` — helpers: `{{json var}}` for objects, `{{eq a b}}` etc. for conditionals

### Variable System

Nodes communicate by writing to a shared `context` object:

```ts
return { ...context, [data.variableName]: { text } }  // AI nodes
return { ...context, [data.variableName]: { httpResponse: { status, data } } }  // HTTP node
```

Downstream nodes reference upstream outputs using Handlebars: `{{myAnthropic.text}}`, `{{myApi.httpResponse.data}}`. The variable inspector (`src/features/editor/lib/get-upstream-variables.ts`) traverses the edge graph backwards to show available variables in node dialogs.

### API Layer

- All client→server data fetching goes through **tRPC** (`src/trpc/routers/_app.ts`)
- Three routers: `workflows`, `credentials`, `executions`
- Procedures use `protectedProcedure` (auth required) or `premiumProcedure` (subscription required)
- Webhooks (Google Forms, Stripe) hit `/api/webhooks/*` route handlers directly

### Auth & Credentials

- Auth is **Better Auth** with Prisma adapter + Polar plugin for billing
- Credential values (API keys) are encrypted with Cryptr before DB storage — always use `encrypt()`/`decrypt()` from `src/lib/encryption.ts`
- `CredentialType` enum currently supports: `OPENAI`, `ANTHROPIC`, `GEMINI`

### Real-time Updates

Each node type has a channel file in `src/inngest/channels/`. Channels publish node status during execution; the editor subscribes using `useNodeStatus` hook which calls a server action to get the realtime token, then listens via `@inngest/realtime`.

### Key Conventions

- **Feature-based structure**: all code for a feature lives in `src/features/<feature>/`
- **Prisma client** is generated to `src/generated/prisma/` (not `node_modules`) — import from `@/generated/prisma`
- **Biome** is the linter/formatter (not ESLint/Prettier) — `npm run lint` and `npm run format`
- **Handlebars** for runtime templating in node prompts/fields; **JSONata** for data transformation in the Transform node
- `tracesSampleRate: 1` in Sentry configs — reduce to `0.1` before production deploy

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL (e.g. `http://localhost:3000`) |
| `ENCRYPTION_KEY` | Yes | 32+ char string for credential encryption |
| `INNGEST_SIGNING_KEY` | Yes | Inngest webhook signing |
| `INNGEST_EVENT_KEY` | Yes | Inngest event publishing |
| `POLAR_ACCESS_TOKEN` | Optional | Billing (can skip for local dev) |
| `POLAR_SUCCESS_URL` | Optional | Post-checkout redirect |
| `GITHUB_CLIENT_ID/SECRET` | Optional | OAuth |
| `GOOGLE_CLIENT_ID/SECRET` | Optional | OAuth |
| `NGROK_URL` | Optional | Tunnel for inbound webhooks |
