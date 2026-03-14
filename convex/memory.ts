import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listByCategory = query({
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
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", args.category)
      )
      .collect();
  },
});

export const search = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Simple text search - matches memories containing the query string
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

export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
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
    relevanceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memories", {
      userId: args.userId,
      category: args.category,
      content: args.content,
      sourceSessionId: args.sourceSessionId,
      relevanceScore: args.relevanceScore ?? 5,
      createdAt: now,
      lastReferencedAt: now,
    });
  },
});

export const updateRelevance = mutation({
  args: {
    memoryId: v.id("memories"),
    relevanceScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      relevanceScore: args.relevanceScore,
      lastReferencedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
  },
});
