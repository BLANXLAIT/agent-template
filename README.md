[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/blanxlait-agent-template-badge.png)](https://mseep.ai/app/blanxlait-agent-template)

# Agent Template

A ready-to-fork template for building autonomous AI agents that connect to [Open Brain](https://brain.blanxlait.ai) — your personal knowledge base.

**Zero cost to run.** Uses [GitHub Models](https://docs.github.com/en/github-models) for AI (free) and GitHub Actions for compute (free tier included).

## How it works

```
GitHub Actions (cron) → OpenAI SDK (GitHub Models) → Open Brain (MCP)
```

Your agent runs on a schedule, uses an AI model to think and act, and reads/writes memories to your Open Brain. No API keys to buy, no servers to manage.

## Quick start

### 1. Fork this repo

Click **Use this template** → **Create a new repository** (or fork it).

### 2. Create an Open Brain agent key

1. Go to [brain.blanxlait.ai](https://brain.blanxlait.ai) and sign in
2. Navigate to **Agents** in the sidebar
3. Click **New agent** and name it (e.g. `my-research-agent`)
4. Copy the API key — it won't be shown again

### 3. Set GitHub repo secrets

Go to your forked repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value |
|--------|-------|
| `OPEN_BRAIN_URL` | `https://brain.blanxlait.ai/mcp` |
| `OPEN_BRAIN_KEY` | The `ob_...` key you just copied |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions — no setup needed.

### 4. Customize your agent

Edit `src/agent.ts` and change:

- **`SYSTEM_PROMPT`** — what your agent does and how it behaves
- **`USER_PROMPT`** — the task to run each time
- **`MODEL`** — any model from [GitHub Models](https://github.com/marketplace/models) (default: `openai/gpt-4.1`)
- **`MAX_TURNS`** — how many tool-calling rounds before stopping

### 5. Set the schedule

Edit `.github/workflows/agent.yml` and change the cron expression:

```yaml
schedule:
  - cron: "30 11 * * *"  # 6:30am EST daily
```

### 6. Enable the workflow

Go to your repo → **Actions** tab → click **I understand my workflows, go ahead and enable them**.

You can also trigger a manual run from the Actions tab to test immediately.

## What the agent can do

The agent connects to Open Brain via MCP and gets access to these tools:

| Tool | Description |
|------|-------------|
| `search_thoughts` | Search your brain by meaning (semantic search) |
| `capture_thought` | Save a new thought with automatic topic extraction |
| `browse_recent` | List recent thoughts chronologically |
| `stats` | Get brain statistics (total thoughts, top topics) |

The AI model decides when and how to use these tools based on your prompt.

## Example agents

**Daily news researcher** — searches the web (if tools added), summarizes findings, captures to brain:
```typescript
const SYSTEM_PROMPT = `You are a daily AI news researcher. Search the brain for
yesterday's briefing to avoid duplicates, then capture today's top 5 AI stories.`;
```

**Decision logger** — reviews recent brain activity and synthesizes patterns:
```typescript
const SYSTEM_PROMPT = `You are a reflective agent. Browse recent thoughts, identify
themes or unresolved decisions, and capture a weekly reflection summary.`;
```

**Learning tracker** — captures what you've been working on:
```typescript
const SYSTEM_PROMPT = `You are a learning journal agent. Search for recent project
activity and capture a summary of skills practiced and progress made.`;
```

## Local development

```bash
npm install

# Set environment variables
export GITHUB_TOKEN="ghp_..."         # GitHub PAT with models:read
export OPEN_BRAIN_URL="https://brain.blanxlait.ai/mcp"
export OPEN_BRAIN_KEY="ob_..."

npm run agent
```

## Project structure

```
├── .github/workflows/agent.yml  ← Schedule + GitHub Actions config
├── src/agent.ts                 ← Your agent (edit this)
├── package.json
└── tsconfig.json
```

## License

MIT
