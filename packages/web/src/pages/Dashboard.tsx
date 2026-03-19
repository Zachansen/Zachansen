import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function Dashboard() {
  const user = useQuery(api.auth.getUser);
  const goals = useQuery(
    api.goals.listActive,
    user ? { userId: user._id } : "skip"
  );
  const sessions = useQuery(
    api.sessions.list,
    user ? { userId: user._id } : "skip"
  );
  const memories = useQuery(
    api.memory.getRecent,
    user ? { userId: user._id, limit: 5 } : "skip"
  );
  const openActions = useQuery(
    api.actionItems.listOpen,
    user ? { userId: user._id } : "skip"
  );
  const overdueActions = useQuery(
    api.actionItems.listOverdue,
    user ? { userId: user._id } : "skip"
  );
  const todayCheckIns = useQuery(
    api.checkins.getToday,
    user ? { userId: user._id } : "skip"
  );
  const streak = useQuery(
    api.checkins.getStreak,
    user ? { userId: user._id } : "skip"
  );
  const activePlan = useQuery(
    api.plans.getActive,
    user ? { userId: user._id } : "skip"
  );
  const currentWeek = useQuery(
    api.plans.getCurrentWeek,
    activePlan ? { planId: activePlan._id } : "skip"
  );
  const weekTactics = useQuery(
    api.plans.getTacticsForWeek,
    activePlan && currentWeek
      ? { planId: activePlan._id, weekNumber: currentWeek.weekNumber }
      : "skip"
  );
  const weekScore = useQuery(
    api.plans.calculateWeekScore,
    activePlan && currentWeek
      ? { planId: activePlan._id, weekNumber: currentWeek.weekNumber }
      : "skip"
  );
  const completeAction = useMutation(api.actionItems.complete);
  const completeTactic = useMutation(api.plans.completeTactic);
  const uncompleteTactic = useMutation(api.plans.uncompleteTactic);

  if (!user) return null;

  const recentSessions = sessions?.slice(0, 3) ?? [];
  const activeGoals = goals ?? [];
  const hasMorningCheckIn = todayCheckIns?.some(
    (c) => c.type === "daily_morning"
  );
  const hasEveningCheckIn = todayCheckIns?.some(
    (c) => c.type === "daily_evening"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Hey{user.name !== "User" ? `, ${user.name}` : ""}.
          </h1>
          <p className="text-gray-400 mt-1">Let's make today count.</p>
        </div>
        {streak !== undefined && streak > 0 && (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400">{streak}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              day streak
            </div>
          </div>
        )}
      </div>

      {/* Today's check-in status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CheckInCard
          title="Morning Intention"
          done={!!hasMorningCheckIn}
          type="daily_morning"
          userId={user._id}
        />
        <CheckInCard
          title="Evening Review"
          done={!!hasEveningCheckIn}
          type="daily_evening"
          userId={user._id}
        />
      </div>

      {/* 12 Week Year Plan Scorecard */}
      {activePlan && currentWeek && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activePlan.title}
              </h2>
              <p className="text-sm text-gray-500">
                Week {currentWeek.weekNumber}/{currentWeek.totalWeeks}
                {currentWeek.isBufferWeek ? " (Buffer Week)" : ""} —{" "}
                {currentWeek.weeksRemaining} weeks remaining
              </p>
            </div>
            {weekScore && (
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${
                    weekScore.score >= 85
                      ? "text-green-400"
                      : weekScore.score >= 60
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {weekScore.score}%
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  execution
                </div>
              </div>
            )}
          </div>

          {/* Week progress bar */}
          <div className="mb-4">
            <div className="flex gap-1">
              {Array.from({ length: currentWeek.totalWeeks }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < currentWeek.weekNumber - 1
                      ? "bg-primary-500"
                      : i === currentWeek.weekNumber - 1
                        ? "bg-primary-400 animate-pulse"
                        : "bg-gray-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* This week's tactics */}
          {weekTactics && weekTactics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                This Week's Tactics ({weekScore?.completed ?? 0}/
                {weekScore?.planned ?? 0})
              </h3>
              <div className="space-y-1.5">
                {weekTactics.map((tactic) => (
                  <div
                    key={tactic._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <button
                      onClick={() =>
                        tactic.completed
                          ? uncompleteTactic({ tacticId: tactic._id })
                          : completeTactic({ tacticId: tactic._id })
                      }
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        tactic.completed
                          ? "bg-green-500 border-green-500"
                          : "border-gray-600 hover:border-primary-500"
                      }`}
                    >
                      {tactic.completed && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={
                        tactic.completed
                          ? "text-gray-500 line-through"
                          : "text-gray-300"
                      }
                    >
                      {tactic.tactic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weekTactics && weekTactics.length === 0 && (
            <p className="text-sm text-gray-600">
              No tactics planned for this week yet.{" "}
              <Link to="/chat" className="text-primary-400 hover:underline">
                Start a session
              </Link>{" "}
              to plan your week.
            </p>
          )}
        </div>
      )}

      {/* Upcoming milestones */}
      {goals && goals.length > 0 && (() => {
        const upcomingMilestones = goals
          .flatMap((g) =>
            g.milestones
              .filter((m) => !m.completed && m.deadline)
              .map((m) => ({ ...m, goalTitle: g.title, goalId: g._id }))
          )
          .sort((a, b) => {
            if (!a.deadline || !b.deadline) return 0;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          })
          .slice(0, 5);

        if (upcomingMilestones.length === 0) return null;

        return (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Upcoming Milestones
            </h3>
            <div className="space-y-2">
              {upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-gray-300">{m.title}</span>
                    <span className="text-gray-600 ml-2 text-xs">
                      ({m.goalTitle})
                    </span>
                  </div>
                  {m.deadline && (
                    <span
                      className={`text-xs ${
                        new Date(m.deadline) < new Date()
                          ? "text-red-400"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(m.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Overdue action items alert */}
      {overdueActions && overdueActions.length > 0 && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
            Overdue Action Items
          </h3>
          <div className="space-y-2">
            {overdueActions.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      completeAction({
                        sessionId: item.sessionId as Id<"sessions">,
                        index: item.index,
                      })
                    }
                    className="w-4 h-4 rounded border border-red-600 hover:bg-red-600 transition-colors flex-shrink-0"
                  />
                  <span className="text-sm text-red-300">{item.text}</span>
                </div>
                <span className="text-xs text-red-600">
                  due {item.deadline}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/chat"
          className="card hover:border-primary-600/50 transition-colors group cursor-pointer"
        >
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            New Coaching Session
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Work through a challenge or plan your next move.
          </p>
        </Link>
        <Link
          to="/goals"
          className="card hover:border-primary-600/50 transition-colors group cursor-pointer"
        >
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            Review Goals
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Check progress and update milestones.
          </p>
        </Link>
        <Link
          to="/memory"
          className="card hover:border-primary-600/50 transition-colors group cursor-pointer"
        >
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            Browse Insights
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Review patterns and breakthroughs.
          </p>
        </Link>
      </div>

      {/* Open Action Items */}
      {openActions && openActions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Action Items</h2>
            <span className="text-xs text-gray-500">
              {openActions.length} open
            </span>
          </div>
          <div className="card space-y-2">
            {openActions.slice(0, 8).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      completeAction({
                        sessionId: item.sessionId as Id<"sessions">,
                        index: item.index,
                      })
                    }
                    className="w-4 h-4 rounded border border-gray-600 hover:bg-primary-600 hover:border-primary-600 transition-colors flex-shrink-0"
                  />
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
                {item.deadline && (
                  <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                    {item.deadline}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Active Goals</h2>
          <Link
            to="/goals"
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            View all
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">No active goals yet.</p>
            <Link
              to="/goals"
              className="text-primary-400 text-sm hover:underline mt-2 inline-block"
            >
              Create your first goal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.slice(0, 4).map((goal) => (
              <div key={goal._id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{goal.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                    {goal.category}
                  </span>
                </div>
                {goal.milestones.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(goal.milestones.filter((m) => m.completed).length / goal.milestones.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {goal.milestones.filter((m) => m.completed).length}/
                        {goal.milestones.length}
                      </span>
                    </div>
                  </div>
                )}
                {goal.deadline && (
                  <p className="text-xs text-gray-600 mt-2">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Sessions
          </h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Link
                key={session._id}
                to={`/chat/${session._id}`}
                className="card block hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300 truncate flex-1">
                    {session.messages[0]?.content.slice(0, 80) ||
                      "Empty session"}
                    {(session.messages[0]?.content.length ?? 0) > 80
                      ? "..."
                      : ""}
                  </p>
                  <span className="text-xs text-gray-600 ml-4 whitespace-nowrap">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {session.frameworksUsed.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {session.frameworksUsed.map((f) => (
                      <span
                        key={f}
                        className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Insights */}
      {memories && memories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Insights
            </h2>
            <Link
              to="/memory"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {memories.map((memory) => (
              <div key={memory._id} className="card py-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs bg-accent-600/20 text-accent-400 px-2 py-0.5 rounded-full mt-0.5">
                    {memory.category}
                  </span>
                  <p className="text-sm text-gray-300">{memory.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckInCard({
  title,
  done,
  type,
  userId,
}: {
  title: string;
  done: boolean;
  type: "daily_morning" | "daily_evening";
  userId: Id<"users">;
}) {
  const [showForm, setShowForm] = useState(false);
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [wins, setWins] = useState("");
  const [blockers, setBlockers] = useState("");
  const createCheckIn = useMutation(api.checkins.create);

  async function handleSubmit() {
    await createCheckIn({
      userId,
      type,
      mood,
      energy,
      wins: wins.trim() || undefined,
      blockers: blockers.trim() || undefined,
    });
    setShowForm(false);
    setWins("");
    setBlockers("");
  }

  if (done) {
    return (
      <div className="card border-green-800/30 bg-green-900/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="font-medium text-green-400">{title}</span>
          <span className="text-xs text-green-700">Done</span>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="card space-y-3">
        <h3 className="font-medium text-white">{title}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">
              Mood: {mood}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">
              Energy: {energy}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {type === "daily_morning" ? (
          <div>
            <label className="text-xs text-gray-500">
              What's your #1 priority today?
            </label>
            <input
              type="text"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="input w-full mt-1"
              placeholder="The one thing that matters most..."
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500">Wins today</label>
              <input
                type="text"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="input w-full mt-1"
                placeholder="What went well?"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Blockers</label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                className="input w-full mt-1"
                placeholder="What held you back?"
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button onClick={handleSubmit} className="btn-primary text-sm">
            Submit
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="card hover:border-primary-600/50 transition-colors text-left w-full"
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
        <span className="font-medium text-gray-300">{title}</span>
        <span className="text-xs text-yellow-600">Pending</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {type === "daily_morning"
          ? "Set your intention for today"
          : "Reflect on your day"}
      </p>
    </button>
  );
}
