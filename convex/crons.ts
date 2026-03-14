import { cronJobs } from "convex/server";

const crons = cronJobs();

// TODO: Add scheduled notification check-ins
// crons.interval("check notifications", { minutes: 5 }, internal.notifications.processQueue);
// crons.cron("morning check-in", "0 8 * * *", internal.notifications.sendMorningCheckIn);
// crons.cron("evening check-in", "0 20 * * *", internal.notifications.sendEveningCheckIn);

export default crons;
