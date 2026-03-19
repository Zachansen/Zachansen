/**
 * Internal functions used by AI actions, crons, and the notification system.
 * These are not exposed to the client.
 */
import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// --- Auth ---

export const getUserInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").first();
  },
});

// --- Sessions ---

export const getSessionInternal = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getRecentSessionsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);
  },
});

export const createSessionInternal = internalMutation({
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

export const getRecentMemoriesInternal = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);
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

// --- Check-ins ---

export const getRecentCheckInsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);
  },
});

export const createCheckInInternal = internalMutation({
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

// --- Notifications ---

export const getPendingNotificationsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("notificationQueue")
      .withIndex("by_scheduled")
      .filter((q) =>
        q.and(
          q.lte(q.field("scheduledFor"), now),
          q.eq(q.field("sentAt"), undefined)
        )
      )
      .take(50);
  },
});

export const scheduleNotificationInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("push"),
      v.literal("sms"),
      v.literal("web_push")
    ),
    message: v.string(),
    scheduledFor: v.number(),
    escalationLevel: v.number(),
    relatedGoalId: v.optional(v.id("goals")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notificationQueue", args);
  },
});

export const markNotificationSentInternal = internalMutation({
  args: { notificationId: v.id("notificationQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { sentAt: Date.now() });
  },
});

// --- 12 Week Year Plan Context ---

export const getActivePlanContextInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get active plan
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();

    if (!plan) return null;

    // Calculate current week
    const start = new Date(plan.startDate).getTime();
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.min(
      Math.floor((now - start) / weekMs) + 1,
      plan.cycleLength + 1
    );

    // Get this week's tactics
    const tactics = await ctx.db
      .query("weeklyTactics")
      .withIndex("by_plan_week", (q) =>
        q.eq("planId", plan._id).eq("weekNumber", weekNumber)
      )
      .collect();

    const planned = tactics.length;
    const completed = tactics.filter((t) => t.completed).length;
    const score = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    // Get goals linked to this plan
    const goals = [];
    for (const goalId of plan.goalIds) {
      const goal = await ctx.db.get(goalId);
      if (goal) goals.push(goal);
    }

    // Get last week's score
    const lastWeekScore = weekNumber > 1
      ? await ctx.db
          .query("weeklyScores")
          .withIndex("by_plan_week", (q) =>
            q.eq("planId", plan._id).eq("weekNumber", weekNumber - 1)
          )
          .first()
      : null;

    return {
      plan,
      weekNumber,
      totalWeeks: plan.cycleLength,
      weeksRemaining: Math.max(0, plan.cycleLength - weekNumber + 1),
      isBufferWeek: weekNumber > plan.cycleLength,
      tactics: tactics.map((t) => ({
        tactic: t.tactic,
        completed: t.completed,
        goalId: t.goalId,
      })),
      currentScore: score,
      planned,
      completed,
      lastWeekScore: lastWeekScore?.executionScore ?? null,
      goals: goals.map((g) => ({
        title: g.title,
        category: g.category,
        milestones: g.milestones,
      })),
    };
  },
});

// --- Escalation tracking ---

export const getEscalationLevel = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Find the most recent check-in
    const lastCheckIn = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    if (!lastCheckIn) return 3; // No check-ins ever = escalation level 3

    const hoursSince =
      (Date.now() - lastCheckIn.createdAt) / (1000 * 60 * 60);

    // Escalation based on hours since last check-in
    if (hoursSince < 24) return 1; // Checked in today
    if (hoursSince < 48) return 2; // Missed one day
    if (hoursSince < 72) return 3; // Missed two days
    if (hoursSince < 120) return 4; // Missed 3-5 days
    return 5; // 5+ days of silence
  },
});
