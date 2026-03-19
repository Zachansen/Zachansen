import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Simple single-user auth. This is a personal app — no need for
 * full auth providers. We just ensure a single user exists.
 */
export const getOrCreateUser = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists (single user app)
    const existing = await ctx.db.query("users").first();
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      timezone: args.timezone ?? "America/New_York",
      notificationPreferences: {
        pushEnabled: true,
        smsEnabled: true,
        webPushEnabled: true,
        morningCheckIn: true,
        eveningCheckIn: true,
      },
      createdAt: Date.now(),
    });
  },
});

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    // Single user app — return the first (and only) user
    return await ctx.db.query("users").first();
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isOnboarded: v.optional(v.boolean()),
    vision: v.optional(v.string()),
    obsidianUrl: v.optional(v.string()),
    obsidianApiKey: v.optional(v.string()),
    obsidianVaultFolder: v.optional(v.string()),
    notificationPreferences: v.optional(
      v.object({
        pushEnabled: v.boolean(),
        smsEnabled: v.boolean(),
        webPushEnabled: v.boolean(),
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
        morningCheckIn: v.boolean(),
        eveningCheckIn: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, filtered);
  },
});
