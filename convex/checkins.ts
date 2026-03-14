import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.optional(v.id("goals")),
    type: v.union(
      v.literal("daily_morning"),
      v.literal("daily_evening"),
      v.literal("milestone"),
      v.literal("weekly_review")
    ),
    mood: v.optional(v.number()),
    energy: v.optional(v.number()),
    confidence: v.optional(v.number()),
    blockers: v.optional(v.string()),
    wins: v.optional(v.string()),
    reflections: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("checkIns", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const getToday = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const all = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    return all.filter((c) => c.createdAt >= startOfDay);
  },
});

export const getStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(90); // Max 90 days back

    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check each day backwards
    for (let i = 0; i < 90; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasCheckIn = checkIns.some(
        (c) =>
          c.createdAt >= dayStart.getTime() &&
          c.createdAt < dayEnd.getTime()
      );

      if (hasCheckIn) {
        streak++;
      } else if (i === 0) {
        // Today hasn't happened yet, skip
        continue;
      } else {
        break;
      }
    }

    return streak;
  },
});
