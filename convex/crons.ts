import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process notification queue every 5 minutes
crons.interval(
  "process notification queue",
  { minutes: 5 },
  internal.notifications.processQueue
);

// Morning check-in at 8 AM UTC (adjust based on user timezone in production)
crons.cron(
  "morning check-in",
  "0 13 * * *", // 8 AM EST = 13:00 UTC
  internal.notifications.triggerMorningCheckIn
);

// Evening check-in at 8 PM UTC
crons.cron(
  "evening check-in",
  "0 1 * * *", // 8 PM EST = 01:00 UTC next day
  internal.notifications.triggerEveningCheckIn
);

// Weekly review on Sunday at 6 PM
crons.cron(
  "weekly review",
  "0 23 * * 0", // Sunday 6 PM EST = 23:00 UTC
  internal.notifications.triggerWeeklyReview
);

export default crons;
