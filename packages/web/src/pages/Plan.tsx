import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CYCLE_OPTIONS = [
  { value: 12, label: "12 Weeks (Standard)" },
  { value: 6, label: "6 Weeks (Sprint)" },
];

export default function Plan() {
  const user = useQuery(api.auth.getUser);
  const activePlan = useQuery(
    api.plans.getActive,
    user ? { userId: user._id } : "skip"
  );
  const allPlans = useQuery(
    api.plans.list,
    user ? { userId: user._id } : "skip"
  );
  const currentWeek = useQuery(
    api.plans.getCurrentWeek,
    activePlan ? { planId: activePlan._id } : "skip"
  );
  const weekScore = useQuery(
    api.plans.calculateWeekScore,
    activePlan && currentWeek
      ? { planId: activePlan._id, weekNumber: currentWeek.weekNumber }
      : "skip"
  );
  const planStats = useQuery(
    api.plans.getPlanStats,
    activePlan ? { planId: activePlan._id } : "skip"
  );
  const weekTactics = useQuery(
    api.plans.getTacticsForWeek,
    activePlan && currentWeek
      ? { planId: activePlan._id, weekNumber: currentWeek.weekNumber }
      : "skip"
  );
  const goals = useQuery(
    api.goals.listActive,
    user ? { userId: user._id } : "skip"
  );

  const createPlan = useMutation(api.plans.create);
  const addTactic = useMutation(api.plans.addTactic);
  const completeTactic = useMutation(api.plans.completeTactic);
  const uncompleteTactic = useMutation(api.plans.uncompleteTactic);
  const removeTactic = useMutation(api.plans.removeTactic);
  const completePlan = useMutation(api.plans.complete);

  const [showCreate, setShowCreate] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planVision, setPlanVision] = useState("");
  const [cycleLength, setCycleLength] = useState(12);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const [newTactic, setNewTactic] = useState("");
  const [tacticGoalId, setTacticGoalId] = useState("");

  if (!user) return null;

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !planTitle.trim() || selectedGoals.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    await createPlan({
      userId: user._id,
      title: planTitle.trim(),
      vision: planVision.trim(),
      startDate: today,
      cycleLength,
      goalIds: selectedGoals as any[],
    });

    setPlanTitle("");
    setPlanVision("");
    setSelectedGoals([]);
    setShowCreate(false);
  }

  async function handleAddTactic(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlan || !currentWeek || !newTactic.trim() || !tacticGoalId) return;

    await addTactic({
      planId: activePlan._id,
      userId: user!._id,
      goalId: tacticGoalId as any,
      weekNumber: currentWeek.weekNumber,
      tactic: newTactic.trim(),
    });
    setNewTactic("");
  }

  // No active plan — show create or history
  if (!activePlan) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">12 Week Year</h1>
            <p className="text-gray-500 mt-1">
              Plan in 12-week cycles for focused execution.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            New Plan
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreatePlan} className="card space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Create a New Plan
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Plan Title
              </label>
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="input w-full"
                placeholder="e.g., Q1 2026 Sprint"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Vision — What does success look like at the end?
              </label>
              <textarea
                value={planVision}
                onChange={(e) => setPlanVision(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Be vivid and specific. What will be different in 12 weeks?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cycle Length
              </label>
              <div className="flex gap-3">
                {CYCLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCycleLength(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      cycleLength === opt.value
                        ? "bg-primary-600/20 border-primary-600/50 text-primary-400"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Goals for this plan (1-3)
              </label>
              {goals && goals.length > 0 ? (
                <div className="space-y-2">
                  {goals.map((g) => (
                    <button
                      key={g._id}
                      type="button"
                      onClick={() =>
                        setSelectedGoals((prev) =>
                          prev.includes(g._id)
                            ? prev.filter((id) => id !== g._id)
                            : prev.length < 3
                              ? [...prev, g._id]
                              : prev
                        )
                      }
                      className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                        selectedGoals.includes(g._id)
                          ? "bg-primary-600/10 border-primary-600/50 text-white"
                          : "bg-gray-800/50 border-gray-700 text-gray-400"
                      }`}
                    >
                      <span className="font-medium">{g.title}</span>
                      <span className="text-xs text-gray-600 ml-2">
                        ({g.category})
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Create goals first on the Goals page.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedGoals.length === 0 || !planTitle.trim()}
              className="btn-primary disabled:opacity-40"
            >
              Start {cycleLength}-Week Plan
            </button>
          </form>
        )}

        {/* Past plans */}
        {allPlans && allPlans.filter((p) => p.status !== "active").length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-400 mb-4">
              Past Plans
            </h2>
            <div className="space-y-3">
              {allPlans
                .filter((p) => p.status !== "active")
                .map((plan) => (
                  <div key={plan._id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {plan.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {plan.startDate} to {plan.endDate} —{" "}
                          {plan.cycleLength} weeks — {plan.status}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          plan.status === "completed"
                            ? "bg-green-900/30 text-green-400"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!showCreate && (!allPlans || allPlans.length === 0) && (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No plans yet.</p>
            <p className="text-gray-600 text-sm mt-1">
              A year is 12 weeks, not 12 months. Create your first plan to start
              executing with urgency.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary mt-4"
            >
              Create Your First Plan
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active plan view
  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{activePlan.title}</h1>
          <p className="text-gray-500 mt-1">
            {activePlan.startDate} to {activePlan.endDate}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {planStats && (
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  planStats.averageScore >= 85
                    ? "text-green-400"
                    : planStats.averageScore >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {planStats.averageScore}%
              </div>
              <div className="text-xs text-gray-500">avg score</div>
            </div>
          )}
          <button
            onClick={() => completePlan({ planId: activePlan._id })}
            className="btn-secondary text-sm"
          >
            Complete Plan
          </button>
        </div>
      </div>

      {/* Vision */}
      {activePlan.vision && (
        <div className="card bg-primary-600/5 border-primary-600/20">
          <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">
            Vision
          </p>
          <p className="text-gray-300">{activePlan.vision}</p>
        </div>
      )}

      {/* Week progress */}
      {currentWeek && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">
              Week {currentWeek.weekNumber}
              {currentWeek.isBufferWeek ? " (Buffer)" : ""}
            </h2>
            <span className="text-sm text-gray-500">
              {currentWeek.weeksRemaining} weeks remaining
            </span>
          </div>

          <div className="flex gap-1 mb-4">
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

          {/* Week score */}
          {weekScore && (
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`text-4xl font-bold ${
                  weekScore.score >= 85
                    ? "text-green-400"
                    : weekScore.score >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {weekScore.score}%
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  {weekScore.completed}/{weekScore.planned} tactics completed
                </p>
                <p
                  className={`text-xs ${
                    weekScore.isOnTrack ? "text-green-500" : "text-yellow-500"
                  }`}
                >
                  {weekScore.isOnTrack
                    ? "On track (85%+ target)"
                    : "Below 85% target — time to execute"}
                </p>
              </div>
            </div>
          )}

          {/* This week's tactics */}
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Tactics this week
          </h3>
          <div className="space-y-1.5 mb-4">
            {weekTactics?.map((tactic) => (
              <div
                key={tactic._id}
                className="flex items-center gap-2 text-sm group"
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
                  className={`flex-1 ${
                    tactic.completed
                      ? "text-gray-500 line-through"
                      : "text-gray-300"
                  }`}
                >
                  {tactic.tactic}
                </span>
                <button
                  onClick={() => removeTactic({ tacticId: tactic._id })}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-opacity"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {(!weekTactics || weekTactics.length === 0) && (
              <p className="text-sm text-gray-600">
                No tactics yet. Add some below.
              </p>
            )}
          </div>

          {/* Add tactic */}
          <form onSubmit={handleAddTactic} className="flex gap-2">
            <select
              value={tacticGoalId}
              onChange={(e) => setTacticGoalId(e.target.value)}
              className="input text-sm py-1.5 w-32"
            >
              <option value="">Goal...</option>
              {activePlan.goalIds.map((gId) => {
                const g = goals?.find((goal) => goal._id === gId);
                return (
                  <option key={gId} value={gId}>
                    {g?.title ?? gId}
                  </option>
                );
              })}
            </select>
            <input
              type="text"
              value={newTactic}
              onChange={(e) => setNewTactic(e.target.value)}
              className="input flex-1 text-sm py-1.5"
              placeholder="Add a tactic for this week..."
            />
            <button type="submit" className="btn-primary text-sm px-3">
              Add
            </button>
          </form>
        </div>
      )}

      {/* Plan stats */}
      {planStats && planStats.weeksScored > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Plan Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">
                {planStats.weeksScored}
              </div>
              <div className="text-xs text-gray-500">Weeks Scored</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {planStats.weeksOnTrack}
              </div>
              <div className="text-xs text-gray-500">Weeks On Track</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${
                  planStats.averageScore >= 85
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {planStats.averageScore}%
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
