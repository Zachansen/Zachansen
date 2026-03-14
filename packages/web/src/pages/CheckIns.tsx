import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function CheckIns() {
  const user = useQuery(api.auth.getUser);
  const checkIns = useQuery(
    api.checkins.list,
    user ? { userId: user._id, limit: 50 } : "skip"
  );
  const streak = useQuery(
    api.checkins.getStreak,
    user ? { userId: user._id } : "skip"
  );

  if (!user) return null;

  // Group check-ins by date
  const grouped: Record<string, typeof checkIns> = {};
  for (const checkIn of checkIns ?? []) {
    const date = new Date(checkIn.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date]!.push(checkIn);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Check-Ins</h1>
          <p className="text-gray-500 mt-1">
            {checkIns?.length ?? 0} check-ins recorded
          </p>
        </div>
        {streak !== undefined && streak > 0 && (
          <div className="card px-6 py-3 text-center">
            <div className="text-3xl font-bold text-primary-400">{streak}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              day streak
            </div>
          </div>
        )}
      </div>

      {/* Mood over time (simple text view) */}
      {checkIns && checkIns.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recent Mood Trend
          </h3>
          <div className="flex items-end gap-1 h-20">
            {checkIns
              .slice(0, 14)
              .reverse()
              .map((c, i) => {
                const mood = c.mood ?? 5;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${mood * 10}%`,
                      backgroundColor:
                        mood >= 7
                          ? "#22c55e"
                          : mood >= 5
                            ? "#eab308"
                            : "#ef4444",
                      opacity: 0.6,
                    }}
                    title={`Mood: ${mood}/10 - ${new Date(c.createdAt).toLocaleDateString()}`}
                  />
                );
              })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-700">2 weeks ago</span>
            <span className="text-xs text-gray-700">today</span>
          </div>
        </div>
      )}

      {/* Check-in history */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No check-ins yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Complete your morning or evening check-in from the dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                {date}
              </h3>
              <div className="space-y-2">
                {items!.map((checkIn) => (
                  <div key={checkIn._id} className="card py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {checkIn.type.replace("daily_", "").replace("_", " ")}
                      </span>
                      {checkIn.mood && (
                        <span className="text-xs text-gray-500">
                          mood: {checkIn.mood}/10
                        </span>
                      )}
                      {checkIn.energy && (
                        <span className="text-xs text-gray-500">
                          energy: {checkIn.energy}/10
                        </span>
                      )}
                      {checkIn.confidence && (
                        <span className="text-xs text-gray-500">
                          confidence: {checkIn.confidence}/10
                        </span>
                      )}
                      <span className="text-xs text-gray-700 ml-auto">
                        {new Date(checkIn.createdAt).toLocaleTimeString(
                          "en-US",
                          { hour: "numeric", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    {checkIn.wins && (
                      <p className="text-sm text-green-400 mt-2">
                        <span className="text-green-700">Wins: </span>
                        {checkIn.wins}
                      </p>
                    )}
                    {checkIn.blockers && (
                      <p className="text-sm text-red-400 mt-1">
                        <span className="text-red-700">Blockers: </span>
                        {checkIn.blockers}
                      </p>
                    )}
                    {checkIn.reflections && (
                      <p className="text-sm text-gray-400 mt-1">
                        {checkIn.reflections}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
