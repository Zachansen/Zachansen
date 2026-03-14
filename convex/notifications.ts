import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPending = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sentAt"), undefined))
      .collect();
  },
});

export const schedule = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("push"),
      v.literal("sms"),
      v.literal("web_push")
    ),
    message: v.string(),
    scheduledFor: v.number(),
    escalationLevel: v.optional(v.number()),
    relatedGoalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notificationQueue", {
      userId: args.userId,
      type: args.type,
      message: args.message,
      scheduledFor: args.scheduledFor,
      escalationLevel: args.escalationLevel ?? 1,
      relatedGoalId: args.relatedGoalId,
    });
  },
});

export const markSent = mutation({
  args: { notificationId: v.id("notificationQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      sentAt: Date.now(),
    });
  },
});
