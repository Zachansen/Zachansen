import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

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

  if (!user) return null;

  const recentSessions = sessions?.slice(0, 3) ?? [];
  const activeGoals = goals ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Hey{user.name !== "User" ? `, ${user.name}` : ""}.
        </h1>
        <p className="text-gray-400 mt-1">Let's make today count.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/chat" className="card hover:border-primary-600/50 transition-colors group cursor-pointer">
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            New Coaching Session
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Work through a challenge or plan your next move.
          </p>
        </Link>

        <Link to="/goals" className="card hover:border-primary-600/50 transition-colors group cursor-pointer">
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            Review Goals
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Check progress and update milestones.
          </p>
        </Link>

        <Link to="/memory" className="card hover:border-primary-600/50 transition-colors group cursor-pointer">
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
            Browse Insights
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Review patterns and breakthroughs.
          </p>
        </Link>
      </div>

      {/* Active Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Active Goals</h2>
          <Link to="/goals" className="text-sm text-primary-400 hover:text-primary-300">
            View all
          </Link>
        </div>

        {activeGoals.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">No active goals yet.</p>
            <Link to="/goals" className="text-primary-400 text-sm hover:underline mt-2 inline-block">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Link
                key={session._id}
                to={`/chat/${session._id}`}
                className="card block hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300 truncate flex-1">
                    {session.messages[0]?.content.slice(0, 80) || "Empty session"}
                    {(session.messages[0]?.content.length ?? 0) > 80 ? "..." : ""}
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
            <h2 className="text-lg font-semibold text-white">Recent Insights</h2>
            <Link to="/memory" className="text-sm text-primary-400 hover:text-primary-300">
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
