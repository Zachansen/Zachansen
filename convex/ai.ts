import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  CORE_SYSTEM_PROMPT,
  AI_TOOLS,
} from "../packages/shared/src/prompts/core";
import { getFrameworkGuide } from "../packages/shared/src/prompts/frameworks";

/**
 * Main AI coaching action. Calls Claude API with tool use for
 * on-demand framework retrieval and memory access.
 */
export const chat = action({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get session history
    const session = await ctx.runQuery(
      internal.internal.getSessionInternal,
      { sessionId: args.sessionId }
    );
    if (!session) throw new Error("Session not found");

    // 2. Save user message
    await ctx.runMutation(internal.internal.addMessageInternal, {
      sessionId: args.sessionId,
      role: "user",
      content: args.userMessage,
      frameworksUsed: [],
    });

    // 3. Build conversation history for Claude
    const messages = [
      ...session.messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: args.userMessage },
    ];

    // 4. Get active goals for context
    const goals = await ctx.runQuery(internal.internal.listActiveInternal, {
      userId: args.userId,
    });
    const goalContext =
      goals.length > 0
        ? `\n\nUSER'S ACTIVE GOALS:\n${goals.map((g: { title: string; description: string; category: string; deadline?: string }) => `- ${g.title} (${g.category}${g.deadline ? `, deadline: ${g.deadline}` : ""}): ${g.description}`).join("\n")}`
        : "";

    // 5. Call Claude API with tool use
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const frameworksUsed: string[] = [];
    let finalResponse = "";

    // Claude API call with tool use loop
    let currentMessages: any[] = [...messages];
    let continueLoop = true;

    while (continueLoop) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-20250514",
          max_tokens: 2048,
          system: CORE_SYSTEM_PROMPT + goalContext,
          messages: currentMessages,
          tools: AI_TOOLS,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      // Process response content blocks
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of data.content) {
        if (block.type === "text") {
          finalResponse += block.text;
        } else if (block.type === "tool_use") {
          const result = await handleToolCall(
            ctx,
            args.userId,
            args.sessionId,
            block.name,
            block.input,
            frameworksUsed
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      if (data.stop_reason === "tool_use" && toolResults.length > 0) {
        // Add assistant response and tool results, continue loop
        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: data.content },
          { role: "user" as const, content: toolResults },
        ];
      } else {
        continueLoop = false;
      }
    }

    // 6. Save assistant response
    await ctx.runMutation(internal.internal.addMessageInternal, {
      sessionId: args.sessionId,
      role: "assistant",
      content: finalResponse,
      frameworksUsed: frameworksUsed,
    });

    return {
      response: finalResponse,
      frameworksUsed,
    };
  },
});

async function handleToolCall(
  ctx: any,
  userId: any,
  sessionId: any,
  toolName: string,
  input: any,
  frameworksUsed: string[]
): Promise<string> {
  switch (toolName) {
    case "getFramework": {
      const guide = getFrameworkGuide(input.name);
      if (guide) {
        frameworksUsed.push(input.name);
        return guide;
      }
      return `Framework "${input.name}" not found.`;
    }

    case "getUserMemories": {
      const memories = await ctx.runQuery(
        internal.internal.searchMemoryInternal,
        { userId, query: input.query }
      );
      if (memories.length === 0) return "No relevant memories found.";
      return memories
        .map(
          (m: { category: string; content: string }) =>
            `[${m.category}] ${m.content}`
        )
        .join("\n");
    }

    case "getMentorPerspective": {
      const board = await ctx.runQuery(
        internal.internal.getMentorBoardInternal,
        { userId }
      );
      if (!board) return "No mentor board set up yet.";
      const mentor = board.mentors.find(
        (m: { name: string }) =>
          m.name.toLowerCase() === input.mentorName.toLowerCase()
      );
      if (!mentor)
        return `Mentor "${input.mentorName}" not found. Available: ${board.mentors.map((m: { name: string }) => m.name).join(", ")}`;
      return `${mentor.name} (${mentor.description}): ${mentor.perspective}\nKey phrases: ${mentor.keyPhrases.join(", ")}`;
    }

    case "createActionItem": {
      await ctx.runMutation(internal.internal.addActionItemInternal, {
        sessionId,
        text: input.text,
        deadline: input.deadline,
      });
      return `Action item saved: "${input.text}"${input.deadline ? ` (due: ${input.deadline})` : ""}`;
    }

    case "extractInsight": {
      await ctx.runMutation(internal.internal.createMemoryInternal, {
        userId,
        category: input.category,
        content: input.content,
        sourceSessionId: sessionId,
        relevanceScore: 5,
      });
      return `Insight saved: [${input.category}] "${input.content}"`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}
