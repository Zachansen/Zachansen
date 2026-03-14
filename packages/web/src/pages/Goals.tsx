import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "health",
  "career",
  "spiritual",
  "relationship",
  "financial",
  "personal",
  "creative",
  "education",
] as const;

type GoalCategory = (typeof CATEGORIES)[number];

export default function Goals() {
  const user = useQuery(api.auth.getUser);
  const goals = useQuery(api.goals.list, user ? { userId: user._id } : "skip");
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const removeGoal = useMutation(api.goals.remove);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("personal");
  const [deadline, setDeadline] = useState("");

  if (!user) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;

    await createGoal({
      userId: user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: deadline || undefined,
    });

    setTitle("");
    setDescription("");
    setCategory("personal");
    setDeadline("");
    setShowForm(false);
  }

  async function handleStatusChange(
    goalId: Id<"goals">,
    status: "active" | "completed" | "paused" | "abandoned"
  ) {
    await updateGoal({ goalId, status });
  }

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const completedGoals = goals?.filter((g) => g.status === "completed") ?? [];
  const otherGoals =
    goals?.filter((g) => g.status === "paused" || g.status === "abandoned") ??
    [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-gray-500 mt-1">
            {activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "New Goal"}
        </button>
      </div>

      {/* Create goal form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="What do you want to achieve?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Why does this matter? What does success look like?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="input w-full"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Deadline (optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Create Goal
          </button>
        </form>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Active</h2>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onStatusChange={handleStatusChange}
                onDelete={() => removeGoal({ goalId: goal._id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4">
            Completed ({completedGoals.length})
          </h2>
          <div className="space-y-3 opacity-75">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onStatusChange={handleStatusChange}
                onDelete={() => removeGoal({ goalId: goal._id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused/Abandoned */}
      {otherGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">
            Paused / Abandoned
          </h2>
          <div className="space-y-3 opacity-50">
            {otherGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onStatusChange={handleStatusChange}
                onDelete={() => removeGoal({ goalId: goal._id })}
              />
            ))}
          </div>
        </div>
      )}

      {(goals?.length ?? 0) === 0 && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No goals yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            What do you want to achieve? Let's make it happen.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onStatusChange,
  onDelete,
}: {
  goal: any;
  onStatusChange: (id: Id<"goals">, status: any) => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{goal.title}</h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {goal.category}
            </span>
          </div>
          {goal.description && (
            <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
              {goal.status !== "active" && (
                <button
                  onClick={() => {
                    onStatusChange(goal._id, "active");
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                >
                  Set Active
                </button>
              )}
              {goal.status !== "completed" && (
                <button
                  onClick={() => {
                    onStatusChange(goal._id, "completed");
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-green-400 hover:bg-gray-700"
                >
                  Mark Complete
                </button>
              )}
              {goal.status !== "paused" && (
                <button
                  onClick={() => {
                    onStatusChange(goal._id, "paused");
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-yellow-400 hover:bg-gray-700"
                >
                  Pause
                </button>
              )}
              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="mt-3 space-y-1">
          {goal.milestones.map((m: any) => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <div
                className={`w-3.5 h-3.5 rounded-full border ${
                  m.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-600"
                }`}
              />
              <span className={m.completed ? "text-gray-500 line-through" : "text-gray-400"}>
                {m.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {goal.deadline && (
        <p className="text-xs text-gray-600 mt-3">
          Due: {new Date(goal.deadline).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
