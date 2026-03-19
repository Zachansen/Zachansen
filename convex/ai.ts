import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  CORE_SYSTEM_PROMPT,
  AI_TOOLS,
  NOTIFICATION_SYSTEM_PROMPT,
  WEEKLY_REVIEW_PROMPT,
} from "./prompts";
import { getFrameworkGuide } from "./frameworks";

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

    // 4. Get active goals and 12WY plan for context
    const goals = await ctx.runQuery(internal.internal.listActiveInternal, {
      userId: args.userId,
    });
    const goalContext =
      goals.length > 0
        ? `\n\nUSER'S ACTIVE GOALS:\n${goals.map((g: { title: string; description: string; category: string; deadline?: string }) => `- ${g.title} (${g.category}${g.deadline ? `, deadline: ${g.deadline}` : ""}): ${g.description}`).join("\n")}`
        : "";

    // 12 Week Year plan context
    const planContext = await ctx.runQuery(
      internal.internal.getActivePlanContextInternal,
      { userId: args.userId }
    );
    const planContextStr = planContext
      ? `\n\n12 WEEK YEAR PLAN: "${planContext.plan.title}" — Week ${planContext.weekNumber}/${planContext.totalWeeks}${planContext.isBufferWeek ? " (BUFFER WEEK)" : ""}, ${planContext.weeksRemaining} weeks remaining
This week's execution: ${planContext.completed}/${planContext.planned} tactics (${planContext.currentScore}%${planContext.currentScore >= 85 ? " — ON TRACK" : " — BELOW TARGET"})${planContext.lastWeekScore !== null ? `\nLast week: ${planContext.lastWeekScore}%` : ""}
Incomplete tactics this week: ${planContext.tactics.filter((t: any) => !t.completed).map((t: any) => `"${t.tactic}"`).join(", ") || "All complete!"}`
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
          system: CORE_SYSTEM_PROMPT + goalContext + planContextStr,
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

/**
 * Generate a contextual notification message using Claude.
 * Uses a lightweight prompt to keep costs minimal.
 */
export const generateNotification = action({
  args: {
    userId: v.id("users"),
    escalationLevel: v.number(),
    goalId: v.optional(v.id("goals")),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    // Gather context
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    const goals = await ctx.runQuery(internal.internal.listActiveInternal, {
      userId: args.userId,
    });

    let targetGoal = null;
    if (args.goalId) {
      targetGoal = goals.find((g: any) => g._id === args.goalId);
    }

    // Get recent check-in history to understand engagement
    const recentCheckIns = await ctx.runQuery(
      internal.internal.getRecentCheckInsInternal,
      { userId: args.userId, limit: 7 }
    );

    const daysSinceLastCheckIn =
      recentCheckIns.length > 0
        ? Math.floor(
            (Date.now() - recentCheckIns[0].createdAt) / (1000 * 60 * 60 * 24)
          )
        : 999;

    // Get recent action items to reference broken commitments
    const recentSessions = await ctx.runQuery(
      internal.internal.getRecentSessionsInternal,
      { userId: args.userId, limit: 3 }
    );

    const uncompletedActions = recentSessions.flatMap((s: any) =>
      s.actionItems.filter((a: any) => !a.completed)
    );

    const contextMsg = `
USER: ${user?.name ?? "User"}
ESCALATION LEVEL: ${args.escalationLevel}/5
DAYS SINCE LAST CHECK-IN: ${daysSinceLastCheckIn}
${targetGoal ? `TARGET GOAL: ${targetGoal.title} (${targetGoal.category}${targetGoal.deadline ? `, deadline: ${targetGoal.deadline}` : ""})` : `ACTIVE GOALS: ${goals.map((g: any) => g.title).join(", ")}`}
${uncompletedActions.length > 0 ? `UNCOMPLETED ACTION ITEMS: ${uncompletedActions.map((a: any) => a.text).join("; ")}` : ""}
${args.context ?? ""}

Generate a single notification message. Keep it under 160 characters.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: NOTIFICATION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: contextMsg }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text ?? "Time to check in on your goals.";
  },
});

/**
 * Generate a weekly review summary using Claude.
 */
export const generateWeeklyReview = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Gather week's data
    const goals = await ctx.runQuery(internal.internal.listActiveInternal, {
      userId: args.userId,
    });
    const sessions = await ctx.runQuery(
      internal.internal.getRecentSessionsInternal,
      { userId: args.userId, limit: 20 }
    );
    const weekSessions = sessions.filter(
      (s: any) => s.createdAt >= oneWeekAgo
    );
    const checkIns = await ctx.runQuery(
      internal.internal.getRecentCheckInsInternal,
      { userId: args.userId, limit: 14 }
    );
    const weekCheckIns = checkIns.filter(
      (c: any) => c.createdAt >= oneWeekAgo
    );
    const memories = await ctx.runQuery(
      internal.internal.getRecentMemoriesInternal,
      { userId: args.userId, limit: 20 }
    );
    const weekMemories = memories.filter(
      (m: any) => m.createdAt >= oneWeekAgo
    );

    // Build context
    const allActionItems = weekSessions.flatMap((s: any) => s.actionItems);
    const completedActions = allActionItems.filter((a: any) => a.completed);
    const frameworksUsed = weekSessions.flatMap(
      (s: any) => s.frameworksUsed
    );
    const frameworkCounts: Record<string, number> = {};
    for (const f of frameworksUsed) {
      frameworkCounts[f] = (frameworkCounts[f] ?? 0) + 1;
    }

    const avgMood =
      weekCheckIns.length > 0
        ? weekCheckIns.reduce(
            (sum: number, c: any) => sum + (c.mood ?? 0),
            0
          ) / weekCheckIns.filter((c: any) => c.mood).length || 0
        : 0;

    const contextMsg = `
WEEK SUMMARY DATA:
- Sessions this week: ${weekSessions.length}
- Check-ins this week: ${weekCheckIns.length}
- Action items created: ${allActionItems.length}
- Action items completed: ${completedActions.length}
- Average mood: ${avgMood.toFixed(1)}/10
- Frameworks used: ${Object.entries(frameworkCounts).map(([k, v]) => `${k}(${v})`).join(", ") || "none"}

ACTIVE GOALS:
${goals.map((g: any) => `- ${g.title} (${g.category}): ${g.description}${g.milestones.length > 0 ? ` [${g.milestones.filter((m: any) => m.completed).length}/${g.milestones.length} milestones]` : ""}`).join("\n")}

NEW INSIGHTS THIS WEEK:
${weekMemories.map((m: any) => `- [${m.category}] ${m.content}`).join("\n") || "None recorded"}

SESSION TOPICS:
${weekSessions.map((s: any) => `- ${s.messages[0]?.content?.slice(0, 100) ?? "empty"}`).join("\n") || "No sessions"}

WINS FROM CHECK-INS:
${weekCheckIns.filter((c: any) => c.wins).map((c: any) => `- ${c.wins}`).join("\n") || "None recorded"}

BLOCKERS FROM CHECK-INS:
${weekCheckIns.filter((c: any) => c.blockers).map((c: any) => `- ${c.blockers}`).join("\n") || "None recorded"}

Generate a comprehensive but concise weekly review.`;

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
        system: WEEKLY_REVIEW_PROMPT,
        messages: [{ role: "user", content: contextMsg }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const review = data.content[0]?.text ?? "Unable to generate review.";

    // Save the review as a special session
    const sessionId = await ctx.runMutation(
      internal.internal.createSessionInternal,
      {
        userId: args.userId,
        goalId: undefined,
      }
    );

    await ctx.runMutation(internal.internal.addMessageInternal, {
      sessionId,
      role: "assistant",
      content: `📋 **WEEKLY REVIEW**\n\n${review}`,
      frameworksUsed: [],
    });

    return { sessionId, review };
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

    case "getPlanContext": {
      const context = await ctx.runQuery(
        internal.internal.getActivePlanContextInternal,
        { userId }
      );
      if (!context) return "No active 12 Week Year plan found.";
      const incompleteTactics = context.tactics
        .filter((t: any) => !t.completed)
        .map((t: any) => `- [ ] ${t.tactic}`)
        .join("\n");
      const completedTactics = context.tactics
        .filter((t: any) => t.completed)
        .map((t: any) => `- [x] ${t.tactic}`)
        .join("\n");
      return `12 WEEK YEAR PLAN: "${context.plan.title}"
Vision: ${context.plan.vision}
Week ${context.weekNumber}/${context.totalWeeks}${context.isBufferWeek ? " (BUFFER WEEK)" : ""} — ${context.weeksRemaining} weeks remaining
Execution score: ${context.currentScore}% (${context.completed}/${context.planned} tactics)${context.currentScore >= 85 ? " ✓ ON TRACK" : " ✗ BELOW 85% TARGET"}
${context.lastWeekScore !== null ? `Last week: ${context.lastWeekScore}%\n` : ""}
Goals in this plan:
${context.goals.map((g: any) => `- ${g.title} (${g.category}) [${g.milestones.filter((m: any) => m.completed).length}/${g.milestones.length} milestones]`).join("\n")}

This week's tactics:
${completedTactics}
${incompleteTactics}`;
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
