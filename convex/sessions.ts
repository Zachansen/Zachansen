import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      goalId: args.goalId,
      messages: [],
      frameworksUsed: [],
      insights: [],
      actionItems: [],
      createdAt: Date.now(),
    });
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    frameworksUsed: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const message = {
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      frameworksUsed: args.frameworksUsed,
    };

    // Update session-level frameworks used
    const newFrameworks = args.frameworksUsed ?? [];
    const allFrameworks = [
      ...new Set([...session.frameworksUsed, ...newFrameworks]),
    ];

    await ctx.db.patch(args.sessionId, {
      messages: [...session.messages, message],
      frameworksUsed: allFrameworks,
    });
  },
});

export const addActionItem = mutation({
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

export const addInsight = mutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      insights: [
        ...session.insights,
        {
          content: args.content,
          category: args.category,
          extractedAt: Date.now(),
        },
      ],
    });
  },
});
