import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * 12 Week Year Plans — the core planning structure.
 * Each plan is a 6 or 12 week cycle with 1-3 linked goals and
 * week-by-week tactical breakdowns.
 */

export const getActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
  },
});

export const get = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get the current week number for an active plan.
 * Week 1 starts on startDate, week 13 is the buffer week.
 */
export const getCurrentWeek = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    const start = new Date(plan.startDate).getTime();
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor((now - start) / weekMs) + 1;

    const isBufferWeek = weekNumber > plan.cycleLength;
    const isComplete = weekNumber > plan.cycleLength + 1;

    return {
      weekNumber: Math.min(weekNumber, plan.cycleLength + 1),
      totalWeeks: plan.cycleLength,
      isBufferWeek,
      isComplete,
      daysIntoWeek: Math.floor(((now - start) % weekMs) / (24 * 60 * 60 * 1000)),
      weeksRemaining: Math.max(0, plan.cycleLength - weekNumber + 1),
    };
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    vision: v.string(),
    startDate: v.string(),
    cycleLength: v.number(), // 6 or 12
    goalIds: v.array(v.id("goals")),
  },
  handler: async (ctx, args) => {
    // Calculate end date
    const start = new Date(args.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + args.cycleLength * 7);

    // Deactivate any existing active plan
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "completed" });
    }

    const planId = await ctx.db.insert("plans", {
      userId: args.userId,
      title: args.title,
      vision: args.vision,
      startDate: args.startDate,
      endDate: end.toISOString().split("T")[0],
      cycleLength: args.cycleLength,
      status: "active",
      goalIds: args.goalIds,
      createdAt: Date.now(),
    });

    // Link goals to this plan
    for (const goalId of args.goalIds) {
      await ctx.db.patch(goalId, { planId });
    }

    return planId;
  },
});

export const complete = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, { status: "completed" });
  },
});

export const abandon = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, { status: "abandoned" });
  },
});

// --- Weekly Tactics ---

export const getTacticsForWeek = query({
  args: {
    planId: v.id("plans"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyTactics")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .collect();
  },
});

export const getAllTactics = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyTactics")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
  },
});

export const addTactic = mutation({
  args: {
    planId: v.id("plans"),
    userId: v.id("users"),
    goalId: v.id("goals"),
    weekNumber: v.number(),
    tactic: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weeklyTactics", {
      planId: args.planId,
      userId: args.userId,
      goalId: args.goalId,
      weekNumber: args.weekNumber,
      tactic: args.tactic,
      completed: false,
    });
  },
});

export const addTacticsBatch = mutation({
  args: {
    tactics: v.array(
      v.object({
        planId: v.id("plans"),
        userId: v.id("users"),
        goalId: v.id("goals"),
        weekNumber: v.number(),
        tactic: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const t of args.tactics) {
      const id = await ctx.db.insert("weeklyTactics", {
        ...t,
        completed: false,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const completeTactic = mutation({
  args: { tacticId: v.id("weeklyTactics") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tacticId, {
      completed: true,
      completedAt: Date.now(),
    });
  },
});

export const uncompleteTactic = mutation({
  args: { tacticId: v.id("weeklyTactics") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tacticId, {
      completed: false,
      completedAt: undefined,
    });
  },
});

export const removeTactic = mutation({
  args: { tacticId: v.id("weeklyTactics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tacticId);
  },
});

// --- Weekly Scores ---

export const getScoresForPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyScores")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
  },
});

export const getScoreForWeek = query({
  args: {
    planId: v.id("plans"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyScores")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .first();
  },
});

/**
 * Calculate the execution score for a given week.
 * Returns the current score even if not yet saved.
 */
export const calculateWeekScore = query({
  args: {
    planId: v.id("plans"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const tactics = await ctx.db
      .query("weeklyTactics")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .collect();

    const planned = tactics.length;
    const completed = tactics.filter((t) => t.completed).length;
    const score = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    return {
      planned,
      completed,
      score,
      isOnTrack: score >= 85,
      tactics,
    };
  },
});

export const saveWeekScore = mutation({
  args: {
    planId: v.id("plans"),
    userId: v.id("users"),
    weekNumber: v.number(),
    wins: v.optional(v.string()),
    blockers: v.optional(v.string()),
    lessonsLearned: v.optional(v.string()),
    nextWeekFocus: v.optional(v.string()),
    aiReview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate score from tactics
    const tactics = await ctx.db
      .query("weeklyTactics")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .collect();

    const planned = tactics.length;
    const completed = tactics.filter((t) => t.completed).length;
    const score = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    // Check if score already exists for this week
    const existing = await ctx.db
      .query("weeklyScores")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", args.planId).eq("weekNumber", args.weekNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tacticsPlanned: planned,
        tacticsCompleted: completed,
        executionScore: score,
        wins: args.wins,
        blockers: args.blockers,
        lessonsLearned: args.lessonsLearned,
        nextWeekFocus: args.nextWeekFocus,
        aiReview: args.aiReview,
      });
      return existing._id;
    }

    return await ctx.db.insert("weeklyScores", {
      planId: args.planId,
      userId: args.userId,
      weekNumber: args.weekNumber,
      tacticsPlanned: planned,
      tacticsCompleted: completed,
      executionScore: score,
      wins: args.wins,
      blockers: args.blockers,
      lessonsLearned: args.lessonsLearned,
      nextWeekFocus: args.nextWeekFocus,
      aiReview: args.aiReview,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get overall plan execution stats.
 */
export const getPlanStats = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("weeklyScores")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    if (scores.length === 0) {
      return { averageScore: 0, weeksScored: 0, weeksOnTrack: 0 };
    }

    const totalScore = scores.reduce((sum, s) => sum + s.executionScore, 0);
    const onTrack = scores.filter((s) => s.executionScore >= 85).length;

    return {
      averageScore: Math.round(totalScore / scores.length),
      weeksScored: scores.length,
      weeksOnTrack: onTrack,
      scores: scores.sort((a, b) => a.weekNumber - b.weekNumber),
    };
  },
});
