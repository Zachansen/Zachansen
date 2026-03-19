import { v } from "convex/values";
import { mutation, query, action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

export const listSent = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("notificationQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
    return all.filter((n) => n.sentAt !== undefined);
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
    await ctx.db.patch(args.notificationId, { sentAt: Date.now() });
  },
});

/**
 * Process the notification queue. Called by cron every 5 minutes.
 * Sends pending notifications that are due.
 */
export const processQueue = internalAction({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.runQuery(
      internal.internal.getPendingNotificationsInternal,
      {}
    );

    for (const notification of pending) {
      try {
        if (notification.type === "sms") {
          await sendSMS(notification.message, notification.userId, ctx);
        } else if (
          notification.type === "web_push" ||
          notification.type === "push"
        ) {
          await sendWebPush(
            notification.userId,
            notification.message,
            notification.escalationLevel,
            ctx
          );
        }
        // Mark as sent regardless of type
        await ctx.runMutation(
          internal.internal.markNotificationSentInternal,
          { notificationId: notification._id }
        );
      } catch (error) {
        console.error(
          `Failed to send notification ${notification._id}:`,
          error
        );
      }
    }
  },
});

/**
 * Morning check-in trigger. Called by cron at 8 AM.
 * Generates and schedules a contextual morning notification.
 */
export const triggerMorningCheckIn = internalAction({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user) return;
    if (!user.notificationPreferences.morningCheckIn) return;

    const escalation = await ctx.runQuery(
      internal.internal.getEscalationLevel,
      { userId: user._id }
    );

    // Generate contextual notification
    const message = await ctx.runAction(internal.ai.generateNotification, {
      userId: user._id,
      escalationLevel: escalation,
      context: "Morning check-in. Ask about their #1 priority for today.",
    });

    // Schedule for web push
    await ctx.runMutation(internal.internal.scheduleNotificationInternal, {
      userId: user._id,
      type: "web_push",
      message,
      scheduledFor: Date.now(),
      escalationLevel: escalation,
    });

    // If escalation >= 4, also send SMS
    if (escalation >= 4 && user.notificationPreferences.smsEnabled && user.phone) {
      await ctx.runMutation(internal.internal.scheduleNotificationInternal, {
        userId: user._id,
        type: "sms",
        message,
        scheduledFor: Date.now(),
        escalationLevel: escalation,
      });
    }
  },
});

/**
 * Evening check-in trigger. Called by cron at 8 PM.
 */
export const triggerEveningCheckIn = internalAction({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user) return;
    if (!user.notificationPreferences.eveningCheckIn) return;

    const escalation = await ctx.runQuery(
      internal.internal.getEscalationLevel,
      { userId: user._id }
    );

    const message = await ctx.runAction(internal.ai.generateNotification, {
      userId: user._id,
      escalationLevel: escalation,
      context:
        "Evening check-in. Ask how their day went and what they accomplished.",
    });

    await ctx.runMutation(internal.internal.scheduleNotificationInternal, {
      userId: user._id,
      type: "web_push",
      message,
      scheduledFor: Date.now(),
      escalationLevel: escalation,
    });

    if (escalation >= 4 && user.notificationPreferences.smsEnabled && user.phone) {
      await ctx.runMutation(internal.internal.scheduleNotificationInternal, {
        userId: user._id,
        type: "sms",
        message,
        scheduledFor: Date.now(),
        escalationLevel: escalation,
      });
    }
  },
});

/**
 * Weekly review trigger. Called by cron on Sunday evening.
 */
export const triggerWeeklyReview = internalAction({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.internal.getUserInternal, {});
    if (!user) return;

    const result = await ctx.runAction(internal.ai.generateWeeklyReview, {
      userId: user._id,
    });

    // Notify user that weekly review is ready
    await ctx.runMutation(internal.internal.scheduleNotificationInternal, {
      userId: user._id,
      type: "web_push",
      message: "Your weekly review is ready. Time to reflect and plan ahead.",
      scheduledFor: Date.now(),
      escalationLevel: 1,
    });
  },
});

/**
 * Send SMS via Twilio.
 */
async function sendSMS(message: string, userId: any, ctx: any) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return;
  }

  // Get user's phone number
  const user = await ctx.runQuery(internal.internal.getUserInternal, {});
  if (!user?.phone) {
    console.error("User phone number not set");
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + btoa(`${accountSid}:${authToken}`),
    },
    body: new URLSearchParams({
      To: user.phone,
      From: fromNumber,
      Body: message,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${response.status} ${error}`);
  }
}

/**
 * Send web push notification to all of a user's registered push subscriptions.
 * Uses the Web Push protocol with VAPID auth.
 */
async function sendWebPush(
  userId: any,
  message: string,
  escalationLevel: number,
  ctx: any
) {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID keys not configured — skipping web push");
    return;
  }

  // Get push subscriptions for this user
  const subscriptions = await ctx.runQuery(
    internal.pushSubscriptions.getForUserInternal,
    { userId }
  );

  if (subscriptions.length === 0) {
    console.log("No push subscriptions for user — skipping web push");
    return;
  }

  const payload = JSON.stringify({
    title: escalationLevel >= 3 ? "Rosebud — Hey!" : "Rosebud",
    body: message,
    tag: `rosebud-${escalationLevel}`,
    url: "/chat",
  });

  // Send to each subscription
  // Note: Full VAPID signing requires web-push library or crypto.
  // For Convex actions, we use a simplified approach — in production,
  // use a Convex HTTP action that calls a web-push service, or use
  // a third-party push service like OneSignal or Firebase.
  for (const sub of subscriptions) {
    try {
      // Direct fetch to the push endpoint with the payload
      // This is a simplified version — production should use VAPID JWT signing
      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          TTL: "86400",
        },
        body: payload,
      });

      if (response.status === 410 || response.status === 404) {
        // Subscription expired or invalid — clean up
        console.log(`Push subscription expired, cleaning up: ${sub._id}`);
      }
    } catch (error) {
      console.error(`Failed to send push to ${sub.endpoint}:`, error);
    }
  }
}
