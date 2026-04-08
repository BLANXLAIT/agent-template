import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// --- Configuration -----------------------------------------------------------
// Customize these for your agent.

const AGENT_NAME = "my-agent";
const MODEL = "openai/gpt-4.1"; // Any model available on GitHub Models
const MAX_TURNS = 10;

const SYSTEM_PROMPT = `You are a helpful research agent with access to a personal knowledge base (Open Brain).

Your job:
1. Search the brain for relevant prior knowledge
2. Do any research or analysis needed
3. Capture a useful summary back to the brain

Be concise and actionable. Always cite sources when capturing new information.`;

const USER_PROMPT = `Search my brain for recent activity, then capture a thought summarizing what you found.`;

// --- Clients -----------------------------------------------------------------

const { GITHUB_TOKEN, OPEN_BRAIN_URL, OPEN_BRAIN_KEY } = process.env;

if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required (set automatically in GitHub Actions)");
if (!OPEN_BRAIN_URL) throw new Error("OPEN_BRAIN_URL is required — set as a GitHub repo secret");
if (!OPEN_BRAIN_KEY) throw new Error("OPEN_BRAIN_KEY is required — create an agent key at your Open Brain dashboard");

const ai = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: GITHUB_TOKEN,
});

async function connectBrain(): Promise<Client> {
  const client = new Client({ name: AGENT_NAME, version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(OPEN_BRAIN_URL!), {
    requestInit: { headers: { "x-api-key": OPEN_BRAIN_KEY! } },
  });
  await client.connect(transport);
  return client;
}

// --- Agent loop --------------------------------------------------------------

async function run() {
  console.log(`Starting ${AGENT_NAME}...`);

  // Connect to Open Brain MCP
  const brain = await connectBrain();
  const { tools: mcpTools } = await brain.listTools();
  console.log(`Connected to Open Brain — ${mcpTools.length} tools available`);

  // Convert MCP tools to OpenAI function-calling format
  const tools: OpenAI.ChatCompletionTool[] = mcpTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
    },
  }));

  // Conversation history
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: USER_PROMPT },
  ];

  // Agentic tool-calling loop
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    console.log(`\n--- Turn ${turn + 1} ---`);

    const response = await ai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
    });

    const choice = response.choices[0];
    const msg = choice.message;
    messages.push(msg);

    // If the model didn't call any tools, we're done
    if (!msg.tool_calls?.length) {
      console.log("\nAgent response:", msg.content);
      break;
    }

    // Execute each tool call via MCP
    for (const call of msg.tool_calls) {
      const { name, arguments: rawArgs } = call.function;
      console.log(`  Tool: ${name}(${rawArgs})`);

      const args = JSON.parse(rawArgs);
      const result = await brain.callTool({ name, arguments: args });

      const parts = Array.isArray(result.content) ? result.content : [];
      const content = parts
        .map((c: { type: string; text?: string }) => c.text ?? JSON.stringify(c))
        .join("\n");

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });

      console.log(`  Result: ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}`);
    }
  }

  await brain.close();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
