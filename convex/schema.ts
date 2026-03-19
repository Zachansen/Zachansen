import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    timezone: v.string(),
    isOnboarded: v.optional(v.boolean()),
    vision: v.optional(v.string()), // 12WY: compelling vision statement
    notificationPreferences: v.object({
      pushEnabled: v.boolean(),
      smsEnabled: v.boolean(),
      webPushEnabled: v.boolean(),
      quietHoursStart: v.optional(v.string()), // "22:00"
      quietHoursEnd: v.optional(v.string()), // "07:00"
      morningCheckIn: v.boolean(),
      eveningCheckIn: v.boolean(),
    }),
    // Obsidian integration
    obsidianUrl: v.optional(v.string()), // e.g. "http://localhost:27124"
    obsidianApiKey: v.optional(v.string()),
    obsidianVaultFolder: v.optional(v.string()), // e.g. "/Rosebud"
    createdAt: v.number(),
  }),

  // 12 Week Year Plans
  plans: defineTable({
    userId: v.id("users"),
    title: v.string(), // e.g. "Q1 2026 Sprint"
    vision: v.string(), // What does success look like at the end of 12 weeks?
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date (12 or 6 weeks from start)
    cycleLength: v.number(), // 6 or 12 weeks
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    goalIds: v.array(v.id("goals")), // 1-3 goals linked to this plan
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Weekly tactics for a plan — the week-by-week breakdown
  weeklyTactics: defineTable({
    planId: v.id("plans"),
    userId: v.id("users"),
    goalId: v.id("goals"), // Which goal this tactic serves
    weekNumber: v.number(), // 1-12 (or 1-6)
    tactic: v.string(), // "Send outreach to 5 prospects"
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_week", ["planId", "weekNumber"])
    .index("by_user", ["userId"]),

  // Weekly scorecards — execution tracking per week
  weeklyScores: defineTable({
    planId: v.id("plans"),
    userId: v.id("users"),
    weekNumber: v.number(),
    tacticsPlanned: v.number(),
    tacticsCompleted: v.number(),
    executionScore: v.number(), // percentage: completed/planned * 100
    wins: v.optional(v.string()),
    blockers: v.optional(v.string()),
    lessonsLearned: v.optional(v.string()),
    nextWeekFocus: v.optional(v.string()),
    aiReview: v.optional(v.string()), // AI-generated weekly review
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_week", ["planId", "weekNumber"])
    .index("by_user", ["userId"]),

  goals: defineTable({
    userId: v.id("users"),
    planId: v.optional(v.id("plans")), // Link to 12WY plan
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
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned"),
      v.literal("paused")
    ),
    milestones: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        deadline: v.optional(v.string()),
        completed: v.boolean(),
        completedAt: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_plan", ["planId"]),

  sessions: defineTable({
    userId: v.id("users"),
    goalId: v.optional(v.id("goals")),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
        frameworksUsed: v.optional(v.array(v.string())),
      })
    ),
    frameworksUsed: v.array(v.string()),
    insights: v.array(
      v.object({
        content: v.string(),
        category: v.string(),
        extractedAt: v.number(),
      })
    ),
    actionItems: v.array(
      v.object({
        text: v.string(),
        deadline: v.optional(v.string()),
        completed: v.boolean(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_goal", ["userId", "goalId"]),

  memories: defineTable({
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
    createdAt: v.number(),
    lastReferencedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"]),

  mentorBoards: defineTable({
    userId: v.id("users"),
    mentors: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        perspective: v.string(),
        keyPhrases: v.array(v.string()),
      })
    ),
  }).index("by_user", ["userId"]),

  checkIns: defineTable({
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
    weeklyScoreId: v.optional(v.id("weeklyScores")), // Link to weekly score
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  notificationQueue: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("push"),
      v.literal("sms"),
      v.literal("web_push")
    ),
    message: v.string(),
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    escalationLevel: v.number(),
    relatedGoalId: v.optional(v.id("goals")),
  })
    .index("by_scheduled", ["scheduledFor"])
    .index("by_user", ["userId"]),

  // Web Push subscriptions
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
