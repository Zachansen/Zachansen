/**
 * Internal functions used by the AI action.
 * These are not exposed to the client.
 */
import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// --- Sessions ---

export const getSessionInternal = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const addMessageInternal = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    frameworksUsed: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const message = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      frameworksUsed:
        args.frameworksUsed.length > 0 ? args.frameworksUsed : undefined,
    };

    const allFrameworks = [
      ...new Set([...session.frameworksUsed, ...args.frameworksUsed]),
    ];

    await ctx.db.patch(args.sessionId, {
      messages: [...session.messages, message],
      frameworksUsed: allFrameworks,
    });
  },
});

export const addActionItemInternal = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    text: v.string(),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      actionItems: [
        ...session.actionItems,
        { text: args.text, deadline: args.deadline, completed: false },
      ],
    });
  },
});

// --- Goals ---

export const listActiveInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
  },
});

// --- Memory ---

export const searchMemoryInternal = internalQuery({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const queryLower = args.query.toLowerCase();
    return all
      .filter((m) => m.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  },
});

export const createMemoryInternal = internalMutation({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("belief"),
      v.literal("pattern"),
      v.literal("breakthrough"),
      v.literal("resistance"),
      v.literal("value"),
      v.literal("trigger"),
      v.literal("preference"),
      v.literal("framework_effectiveness")
    ),
    content: v.string(),
    sourceSessionId: v.optional(v.id("sessions")),
    relevanceScore: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memories", {
      userId: args.userId,
      category: args.category,
      content: args.content,
      sourceSessionId: args.sourceSessionId,
      relevanceScore: args.relevanceScore,
      createdAt: now,
      lastReferencedAt: now,
    });
  },
});

// --- Mentors ---

export const getMentorBoardInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mentorBoards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});
