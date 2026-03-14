import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listActive = query({
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

export const get = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.goalId);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("health"),
      v.literal("career"),
      v.literal("spiritual"),
      v.literal("relationship"),
      v.literal("financial"),
      v.literal("personal"),
      v.literal("creative"),
      v.literal("education")
    ),
    deadline: v.optional(v.string()),
    milestones: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          deadline: v.optional(v.string()),
          completed: v.boolean(),
          completedAt: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("goals", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      category: args.category,
      deadline: args.deadline,
      status: "active",
      milestones: args.milestones ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned"),
        v.literal("paused")
      )
    ),
    deadline: v.optional(v.string()),
    milestones: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          deadline: v.optional(v.string()),
          completed: v.boolean(),
          completedAt: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(goalId, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});
