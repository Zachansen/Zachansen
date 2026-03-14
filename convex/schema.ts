import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    timezone: v.string(),
    notificationPreferences: v.object({
      pushEnabled: v.boolean(),
      smsEnabled: v.boolean(),
      webPushEnabled: v.boolean(),
      quietHoursStart: v.optional(v.string()), // "22:00"
      quietHoursEnd: v.optional(v.string()), // "07:00"
      morningCheckIn: v.boolean(),
      eveningCheckIn: v.boolean(),
    }),
    createdAt: v.number(),
  }),

  goals: defineTable({
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
  }).index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

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
  }).index("by_user", ["userId"])
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
  }).index("by_user", ["userId"])
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
    createdAt: v.number(),
  }).index("by_user", ["userId"])
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
  }).index("by_scheduled", ["scheduledFor"])
    .index("by_user", ["userId"]),
});
