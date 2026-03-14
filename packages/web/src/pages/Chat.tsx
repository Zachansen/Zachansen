import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useQuery(api.auth.getUser);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createSession = useMutation(api.sessions.create);
  const chatAction = useAction(api.ai.chat);

  // Get current session
  const currentSession = useQuery(
    api.sessions.get,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip"
  );

  // Get recent sessions for sidebar
  const sessions = useQuery(
    api.sessions.list,
    user ? { userId: user._id } : "skip"
  );

  // Get active goals for goal selector
  const goals = useQuery(
    api.goals.listActive,
    user ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  async function handleNewSession(goalId?: Id<"goals">) {
    if (!user) return;
    const id = await createSession({ userId: user._id, goalId });
    navigate(`/chat/${id}`);
  }

  async function handleSend() {
    if (!input.trim() || !sessionId || !user || isLoading) return;

    const message = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await chatAction({
        sessionId: sessionId as Id<"sessions">,
        userId: user._id,
        userMessage: message,
      });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6">
      {/* Session list sidebar */}
      <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <button onClick={() => handleNewSession()} className="btn-primary w-full text-sm">
            New Session
          </button>
        </div>

        {/* Goal quick-start */}
        {goals && goals.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Quick start with goal
            </p>
            <div className="space-y-1">
              {goals.slice(0, 5).map((goal) => (
                <button
                  key={goal._id}
                  onClick={() => handleNewSession(goal._id)}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded px-2 py-1.5 truncate transition-colors"
                >
                  {goal.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-2 space-y-1">
          {sessions?.map((session) => (
            <button
              key={session._id}
              onClick={() => navigate(`/chat/${session._id}`)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                sessionId === session._id
                  ? "bg-primary-600/20 text-primary-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <div className="truncate">
                {session.messages[0]?.content.slice(0, 40) || "New session"}
                {session.messages[0]?.content && session.messages[0].content.length > 40 ? "..." : ""}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!sessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-300 mb-2">
                Ready to work on your goals?
              </h2>
              <p className="text-gray-500 mb-6">
                Start a new coaching session or pick up where you left off.
              </p>
              <button onClick={() => handleNewSession()} className="btn-primary">
                Start Session
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {currentSession?.messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <p className="text-lg">What are we working on today?</p>
                  <p className="text-sm mt-1">
                    Tell me about a goal, a challenge, or what's on your mind.
                  </p>
                </div>
              )}

              {currentSession?.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      msg.role === "user"
                        ? "chat-bubble-user"
                        : "chat-bubble-assistant"
                    }
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.frameworksUsed && msg.frameworksUsed.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {msg.frameworksUsed.map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Action items bar */}
            {currentSession?.actionItems && currentSession.actionItems.length > 0 && (
              <div className="px-6 py-2 bg-gray-900/80 border-t border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Action Items
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentSession.actionItems.map((item, i) => (
                    <span
                      key={i}
                      className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-lg"
                    >
                      {item.text}
                      {item.deadline && (
                        <span className="text-primary-600 ml-1">
                          ({item.deadline})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?"
                  rows={1}
                  className="input flex-1 resize-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
