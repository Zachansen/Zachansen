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

/**
 * Get framework effectiveness data — which frameworks have been
 * most useful based on stored memories and session data.
 */
export const getFrameworkStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get framework effectiveness memories
    const effectivenessMemories = await ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", "framework_effectiveness")
      )
      .collect();

    // Get all sessions to count framework usage
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const stats: Record<
      string,
      { count: number; notes: string[] }
    > = {};

    // Count framework usage across sessions
    for (const session of sessions) {
      for (const fw of session.frameworksUsed) {
        if (!stats[fw]) stats[fw] = { count: 0, notes: [] };
        stats[fw].count++;
      }
    }

    // Add effectiveness notes
    for (const mem of effectivenessMemories) {
      // Try to extract framework name from the content
      for (const fw of Object.keys(stats)) {
        if (mem.content.toLowerCase().includes(fw.toLowerCase())) {
          stats[fw].notes.push(mem.content);
        }
      }
    }

    return stats;
  },
});

/**
 * Get pattern summary — recurring themes across memories.
 */
export const getPatterns = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const patterns = await ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", "pattern")
      )
      .collect();

    const resistances = await ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", "resistance")
      )
      .collect();

    const breakthroughs = await ctx.db
      .query("memories")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", "breakthrough")
      )
      .collect();

    return {
      patterns: patterns.sort((a, b) => b.relevanceScore - a.relevanceScore),
      resistances: resistances.sort(
        (a, b) => b.relevanceScore - a.relevanceScore
      ),
      breakthroughs: breakthroughs.sort(
        (a, b) => b.createdAt - a.createdAt
      ),
    };
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
