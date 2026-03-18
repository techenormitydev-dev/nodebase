# Mindflow

**Visual workflow automation platform powered by AI** — build automations between your tools without writing code.

Nodebase is a Zapier/Make alternative built AI-native from day one. Connect triggers, AI models, and services using a drag-and-drop node editor. Runs reliably in the background with real-time execution tracking.

> Built as a production-grade SaaS showcase: visual node editor, multi-LLM support, background job processing, real-time execution monitoring, and subscription billing — all in one stack.

---

## Demo

<!-- Add a GIF/video of the workflow editor here -->
<!-- ![Nodebase workflow editor demo](./docs/demo.gif) -->

**Live URL:** _Coming soon_

---

## Features

### Workflow Editor
- Drag-and-drop canvas built with React Flow
- Connect nodes visually — no code required
- Real-time execution status per node (via Inngest Realtime)

### Triggers
| Node | Description |
|---|---|
| Manual | Trigger workflows on demand |
| Cron | Schedule with any cron expression + timezone |
| Google Forms | Fires on form submission via webhook |
| Stripe | Fires on Stripe payment events |

### Actions
| Node | Description |
|---|---|
| OpenAI | GPT-4 with system/user prompt + variable templating |
| Anthropic | Claude Sonnet with system/user prompt + variable templating |
| Gemini | Gemini 2.0 Flash with system/user prompt + variable templating |
| Slack | Send messages via webhook |
| Discord | Send messages via webhook |
| HTTP Request | Make any GET/POST/PUT/PATCH/DELETE request |
| Transform | Reshape data using JSONata expressions |
| Conditional | Branch execution with if/else logic |
| Error Handler | Catch failures and route to recovery steps |

### Platform
- **Variable templating** — pass data between nodes using `{{nodeName.field}}` (Handlebars)
- **Execution history** — full input/output per node, success/failure per run
- **Credential vault** — encrypted storage for API keys (OpenAI, Anthropic, Gemini)
- **Subscription billing** — plan-gated features via Polar
- **Auth** — email/password + OAuth (GitHub, Google) via Better Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| API | tRPC 11 + React Query |
| Database | PostgreSQL + Prisma 6 |
| Background jobs | Inngest |
| Real-time | @inngest/realtime |
| Node editor | React Flow (@xyflow/react) |
| AI SDKs | Vercel AI SDK (OpenAI, Anthropic, Gemini) |
| Templating | Handlebars + JSONata |
| Auth | Better Auth + Polar OAuth |
| Billing | Polar |
| Styling | Tailwind CSS 4 + Radix UI |
| Encryption | Cryptr |
| Error tracking | Sentry |

---

## Architecture

```
User triggers workflow
        ↓
Inngest event fired
        ↓
executeWorkflow function
        ↓
Nodes sorted by dependency (topological sort)
        ↓
Each node executor runs in order
  - Context accumulates between nodes
  - Conditional branches filter execution path
  - Error handler catches failures
        ↓
Execution record saved (SUCCESS / FAILED)
Real-time status updates streamed to UI
```

**Key design decisions:**
- **Inngest over raw queues** — built-in retries, step functions, cron, and realtime out of the box. No need to manage SQS/BullMQ infrastructure.
- **tRPC over REST** — end-to-end type safety from DB schema to React component. Eliminates a whole class of runtime errors.
- **Handlebars for templating** — lets non-technical users reference data from previous nodes with `{{slack.response}}` without writing code.
- **JSONata for transforms** — a query language purpose-built for JSON reshaping, far more expressive than custom mapping UIs.
- **Topological sort for DAG execution** — correctly handles branching/merging workflows without hardcoding execution order.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── workflows/          # Workflow list + editor
│   ├── executions/         # Execution history + detail
│   └── credentials/        # API key management
├── features/               # Feature-based modules
│   ├── workflows/          # Workflow editor, node canvas
│   ├── executions/         # Execution runner, executor registry
│   ├── triggers/           # Trigger node components + executors
│   └── actions/            # Action node components + executors
├── inngest/                # Background job functions
├── trpc/                   # tRPC routers
├── lib/                    # Auth, encryption, shared utils
└── config/                 # Node registry, app config
prisma/
└── schema.prisma           # Database schema
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Inngest CLI (`npm i -g inngest-cli`)

### Environment Variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Run

```bash
npm install
npx prisma migrate dev
npm run dev:all   # starts Next.js + Inngest dev server simultaneously
```

Open [http://localhost:3000](http://localhost:3000)

---

## Roadmap

- [ ] Email node (Gmail / SMTP)
- [ ] Google Sheets read/write
- [ ] Workflow templates gallery
- [ ] Inbound webhook trigger (generic)
- [ ] HubSpot / Notion / Airtable integrations
- [ ] Dark/light mode toggle
- [ ] Workflow duplication
- [ ] Re-run failed executions
- [ ] Team workspaces with roles
- [ ] Landing page

---

## License

MIT
