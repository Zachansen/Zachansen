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

type Tab = "insights" | "patterns" | "frameworks";

export default function Memory() {
  const user = useQuery(api.auth.getUser);
  const allMemories = useQuery(
    api.memory.list,
    user ? { userId: user._id } : "skip"
  );
  const patterns = useQuery(
    api.memory.getPatterns,
    user ? { userId: user._id } : "skip"
  );
  const frameworkStats = useQuery(
    api.memory.getFrameworkStats,
    user ? { userId: user._id } : "skip"
  );
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<Tab>("insights");

  if (!user) return null;

  const filtered =
    allMemories?.filter((m) => {
      const matchesCategory = filter === "all" || m.category === filter;
      const matchesSearch =
        !searchQuery ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) ?? [];

  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Memory</h1>
        <p className="text-gray-500 mt-1">
          {allMemories?.length ?? 0} insight
          {(allMemories?.length ?? 0) !== 1 ? "s" : ""} stored
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {(
          [
            { key: "insights", label: "All Insights" },
            { key: "patterns", label: "Patterns & Blocks" },
            { key: "frameworks", label: "Framework Stats" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              tab === t.key
                ? "bg-gray-800 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "insights" && (
        <>
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
                        CATEGORY_COLORS[memory.category] ??
                        "bg-gray-600/20 text-gray-400"
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
        </>
      )}

      {tab === "patterns" && (
        <div className="space-y-6">
          {/* Breakthroughs */}
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3">
              Breakthroughs
            </h3>
            {patterns?.breakthroughs.length === 0 ? (
              <p className="text-sm text-gray-600">None recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {patterns?.breakthroughs.map((m) => (
                  <div
                    key={m._id}
                    className="card py-3 border-green-800/30 bg-green-900/5"
                  >
                    <p className="text-sm text-green-300">{m.content}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patterns */}
          <div>
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-3">
              Recurring Patterns
            </h3>
            {patterns?.patterns.length === 0 ? (
              <p className="text-sm text-gray-600">None identified yet.</p>
            ) : (
              <div className="space-y-2">
                {patterns?.patterns.map((m) => (
                  <div
                    key={m._id}
                    className="card py-3 border-yellow-800/30 bg-yellow-900/5"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-yellow-300">{m.content}</p>
                      <span className="text-xs text-yellow-700 whitespace-nowrap ml-2">
                        relevance: {m.relevanceScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resistances */}
          <div>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
              Resistances & Blocks
            </h3>
            {patterns?.resistances.length === 0 ? (
              <p className="text-sm text-gray-600">None identified yet.</p>
            ) : (
              <div className="space-y-2">
                {patterns?.resistances.map((m) => (
                  <div
                    key={m._id}
                    className="card py-3 border-red-800/30 bg-red-900/5"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-red-300">{m.content}</p>
                      <span className="text-xs text-red-700 whitespace-nowrap ml-2">
                        relevance: {m.relevanceScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "frameworks" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Frameworks used in your coaching sessions, ranked by frequency.
          </p>

          {!frameworkStats ||
          Object.keys(frameworkStats).length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">
                No framework data yet. Start a coaching session to see which
                approaches work best for you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(frameworkStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([name, data]) => (
                  <div key={name} className="card py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{name}</h4>
                      <span className="text-sm text-primary-400">
                        {data.count} session
                        {data.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* Usage bar */}
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (data.count / Math.max(...Object.values(frameworkStats).map((d) => d.count))) * 100)}%`,
                        }}
                      />
                    </div>
                    {data.notes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {data.notes.slice(0, 2).map((note, i) => (
                          <p
                            key={i}
                            className="text-xs text-gray-500 italic"
                          >
                            "{note}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
