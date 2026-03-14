import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "breakthrough", label: "Breakthroughs" },
  { key: "pattern", label: "Patterns" },
  { key: "belief", label: "Beliefs" },
  { key: "resistance", label: "Resistance" },
  { key: "value", label: "Values" },
  { key: "trigger", label: "Triggers" },
  { key: "preference", label: "Preferences" },
  { key: "framework_effectiveness", label: "Framework Notes" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  breakthrough: "bg-green-600/20 text-green-400",
  pattern: "bg-yellow-600/20 text-yellow-400",
  belief: "bg-blue-600/20 text-blue-400",
  resistance: "bg-red-600/20 text-red-400",
  value: "bg-purple-600/20 text-purple-400",
  trigger: "bg-orange-600/20 text-orange-400",
  preference: "bg-cyan-600/20 text-cyan-400",
  framework_effectiveness: "bg-gray-600/20 text-gray-400",
};

export default function Memory() {
  const user = useQuery(api.auth.getUser);
  const allMemories = useQuery(
    api.memory.list,
    user ? { userId: user._id } : "skip"
  );
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const filtered = allMemories?.filter((m) => {
    const matchesCategory = filter === "all" || m.category === filter;
    const matchesSearch =
      !searchQuery ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) ?? [];

  // Sort by most recent
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Memory</h1>
        <p className="text-gray-500 mt-1">
          {allMemories?.length ?? 0} insight{(allMemories?.length ?? 0) !== 1 ? "s" : ""} stored
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search insights..."
        className="input w-full"
      />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              filter === cat.key
                ? "bg-primary-600/20 text-primary-400 border border-primary-600/30"
                : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memories list */}
      {sorted.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {allMemories?.length === 0
              ? "No insights yet. Start a coaching session to build your memory."
              : "No memories match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((memory) => (
            <div key={memory._id} className="card py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                    CATEGORY_COLORS[memory.category] ?? "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {memory.category}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{memory.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-600">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-700">
                      relevance: {memory.relevanceScore}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
