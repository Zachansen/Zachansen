import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all uncompleted action items across all sessions.
 */
export const listOpen = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const openItems: Array<{
      sessionId: string;
      index: number;
      text: string;
      deadline?: string;
      sessionDate: number;
    }> = [];

    for (const session of sessions) {
      for (let i = 0; i < session.actionItems.length; i++) {
        const item = session.actionItems[i];
        if (!item.completed) {
          openItems.push({
            sessionId: session._id,
            index: i,
            text: item.text,
            deadline: item.deadline,
            sessionDate: session.createdAt,
          });
        }
      }
    }

    // Sort by deadline (soonest first), then by creation date
    return openItems.sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.sessionDate - a.sessionDate;
    });
  },
});

/**
 * Mark an action item as completed.
 */
export const complete = mutation({
  args: {
    sessionId: v.id("sessions"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const items = [...session.actionItems];
    if (args.index < 0 || args.index >= items.length) {
      throw new Error("Invalid action item index");
    }

    items[args.index] = { ...items[args.index], completed: true };
    await ctx.db.patch(args.sessionId, { actionItems: items });
  },
});

/**
 * Uncomplete an action item (undo).
 */
export const uncomplete = mutation({
  args: {
    sessionId: v.id("sessions"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const items = [...session.actionItems];
    if (args.index < 0 || args.index >= items.length) {
      throw new Error("Invalid action item index");
    }

    items[args.index] = { ...items[args.index], completed: false };
    await ctx.db.patch(args.sessionId, { actionItems: items });
  },
});

/**
 * Get overdue action items.
 */
export const listOverdue = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const today = new Date().toISOString().split("T")[0];
    const overdueItems: Array<{
      sessionId: string;
      index: number;
      text: string;
      deadline: string;
    }> = [];

    for (const session of sessions) {
      for (let i = 0; i < session.actionItems.length; i++) {
        const item = session.actionItems[i];
        if (!item.completed && item.deadline && item.deadline < today) {
          overdueItems.push({
            sessionId: session._id,
            index: i,
            text: item.text,
            deadline: item.deadline,
          });
        }
      }
    }

    return overdueItems;
  },
});
