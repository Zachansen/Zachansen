import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mentorBoards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    mentors: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        perspective: v.string(),
        keyPhrases: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mentorBoards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { mentors: args.mentors });
      return existing._id;
    } else {
      return await ctx.db.insert("mentorBoards", {
        userId: args.userId,
        mentors: args.mentors,
      });
    }
  },
});

export const addMentor = mutation({
  args: {
    userId: v.id("users"),
    mentor: v.object({
      name: v.string(),
      description: v.string(),
      perspective: v.string(),
      keyPhrases: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("mentorBoards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (board) {
      await ctx.db.patch(board._id, {
        mentors: [...board.mentors, args.mentor],
      });
    } else {
      await ctx.db.insert("mentorBoards", {
        userId: args.userId,
        mentors: [args.mentor],
      });
    }
  },
});

export const removeMentor = mutation({
  args: {
    userId: v.id("users"),
    mentorName: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("mentorBoards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (board) {
      await ctx.db.patch(board._id, {
        mentors: board.mentors.filter((m) => m.name !== args.mentorName),
      });
    }
  },
});
