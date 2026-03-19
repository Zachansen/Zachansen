import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Obsidian Local REST API integration.
 * Syncs session summaries, insights, and action items to an Obsidian vault
 * via the Local REST API plugin (https://github.com/coddingtonbear/obsidian-local-rest-api).
 *
 * Requirements:
 * - Obsidian running with Local REST API plugin enabled
 * - Plugin configured with an API key
 * - User's obsidianUrl, obsidianApiKey, obsidianVaultFolder set in Settings
 */

/**
 * Sync a coaching session to Obsidian as a note.
 */
export const syncSession = action({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user?.obsidianUrl || !user?.obsidianApiKey) {
      return { success: false, error: "Obsidian not configured" };
    }

    const session = await ctx.runQuery(internal.internal.getSessionInternal, {
      sessionId: args.sessionId,
    });
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // Build the markdown note
    const date = new Date(session.createdAt);
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const frameworks =
      session.frameworksUsed.length > 0
        ? session.frameworksUsed.join(", ")
        : "None";

    const insights = session.insights
      .map(
        (i: { category: string; content: string }) =>
          `- **[${i.category}]** ${i.content}`
      )
      .join("\n");

    const actionItems = session.actionItems
      .map(
        (a: { text: string; completed: boolean; deadline?: string }) =>
          `- [${a.completed ? "x" : " "}] ${a.text}${a.deadline ? ` (due: ${a.deadline})` : ""}`
      )
      .join("\n");

    // Summarize conversation (first and last messages)
    const messages = session.messages;
    const firstUserMsg =
      messages.find((m: { role: string }) => m.role === "user")?.content ?? "";
    const lastAssistantMsg =
      [...messages]
        .reverse()
        .find((m: { role: string }) => m.role === "assistant")?.content ?? "";

    const markdown = `---
date: ${dateStr}
time: ${timeStr}
type: coaching-session
frameworks: [${frameworks}]
tags: [rosebud, coaching]
---

# Coaching Session — ${dateStr} ${timeStr}

## Topic
${firstUserMsg.slice(0, 200)}${firstUserMsg.length > 200 ? "..." : ""}

## Frameworks Used
${frameworks}

## Key Insights
${insights || "No insights extracted."}

## Action Items
${actionItems || "No action items."}

## Summary
${lastAssistantMsg.slice(0, 500)}${lastAssistantMsg.length > 500 ? "..." : ""}

---
*Synced from Rosebud Goal Coach*
`;

    const folder = user.obsidianVaultFolder || "/Rosebud";
    const notePath = `${folder}/Sessions/${dateStr}-session.md`;

    return await writeToObsidian(
      user.obsidianUrl,
      user.obsidianApiKey,
      notePath,
      markdown
    );
  },
});

/**
 * Sync weekly review to Obsidian.
 */
export const syncWeeklyReview = action({
  args: {
    userId: v.id("users"),
    review: v.string(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user?.obsidianUrl || !user?.obsidianApiKey) {
      return { success: false, error: "Obsidian not configured" };
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const folder = user.obsidianVaultFolder || "/Rosebud";
    const notePath = `${folder}/Reviews/Week-${args.weekNumber}-${dateStr}.md`;

    const markdown = `---
date: ${dateStr}
type: weekly-review
week: ${args.weekNumber}
tags: [rosebud, weekly-review]
---

# Weekly Review — Week ${args.weekNumber}

${args.review}

---
*Synced from Rosebud Goal Coach*
`;

    return await writeToObsidian(
      user.obsidianUrl,
      user.obsidianApiKey,
      notePath,
      markdown
    );
  },
});

/**
 * Sync all insights to a running Obsidian note.
 */
export const syncInsights = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user?.obsidianUrl || !user?.obsidianApiKey) {
      return { success: false, error: "Obsidian not configured" };
    }

    const memories = await ctx.runQuery(
      internal.internal.getRecentMemoriesInternal,
      { userId: args.userId, limit: 50 }
    );

    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      if (!grouped[m.category]) grouped[m.category] = [];
      const date = new Date(m.createdAt).toISOString().split("T")[0];
      grouped[m.category].push(`- ${m.content} *(${date})*`);
    }

    const sections = Object.entries(grouped)
      .map(([cat, items]) => `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n${items.join("\n")}`)
      .join("\n\n");

    const dateStr = new Date().toISOString().split("T")[0];
    const folder = user.obsidianVaultFolder || "/Rosebud";
    const notePath = `${folder}/Insights.md`;

    const markdown = `---
date: ${dateStr}
type: insights
tags: [rosebud, insights]
---

# Rosebud Insights

*Last synced: ${dateStr}*

${sections || "No insights yet."}

---
*Auto-synced from Rosebud Goal Coach*
`;

    return await writeToObsidian(
      user.obsidianUrl,
      user.obsidianApiKey,
      notePath,
      markdown
    );
  },
});

/**
 * Test the Obsidian connection.
 */
export const testConnection = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user?.obsidianUrl || !user?.obsidianApiKey) {
      return { success: false, error: "Obsidian URL and API key not configured" };
    }

    try {
      const response = await fetch(`${user.obsidianUrl}/`, {
        headers: {
          Authorization: `Bearer ${user.obsidianApiKey}`,
        },
      });

      if (response.ok) {
        return { success: true };
      }
      return {
        success: false,
        error: `Connection failed: ${response.status} ${response.statusText}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Cannot reach Obsidian: ${error.message}`,
      };
    }
  },
});

/**
 * Write/update a file in Obsidian via the Local REST API.
 */
async function writeToObsidian(
  baseUrl: string,
  apiKey: string,
  path: string,
  content: string
) {
  try {
    const response = await fetch(
      `${baseUrl}/vault${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "text/markdown",
        },
        body: content,
      }
    );

    if (response.ok) {
      return { success: true };
    }
    const error = await response.text();
    return {
      success: false,
      error: `Obsidian API error: ${response.status} ${error}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to write to Obsidian: ${error.message}`,
    };
  }
}
