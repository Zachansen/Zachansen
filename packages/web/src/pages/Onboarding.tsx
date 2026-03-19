import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DEFAULT_MENTORS } from "@rosebud/shared/prompts/mentors";
import { useNavigate } from "react-router-dom";

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

const CATEGORY_ICONS: Record<string, string> = {
  health: "💪",
  career: "🚀",
  spiritual: "🙏",
  relationship: "❤️",
  financial: "💰",
  personal: "🌱",
  creative: "🎨",
  education: "📚",
};

const STEPS = ["Welcome", "Goal", "Milestones", "Council", "Notifications", "Ready"];

export default function Onboarding() {
  const user = useQuery(api.auth.getUser);
  const updateUser = useMutation(api.auth.updateUser);
  const createGoal = useMutation(api.goals.create);
  const upsertBoard = useMutation(api.mentors.upsert);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Step 1: Welcome
  const [name, setName] = useState("");

  // Step 2: Goal
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState<GoalCategory>("personal");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Step 3: Milestones
  const [milestones, setMilestones] = useState<
    { id: string; title: string; deadline?: string }[]
  >([]);
  const [newMilestone, setNewMilestone] = useState("");

  // Step 4: Council
  const [selectedMentors, setSelectedMentors] = useState<number[]>([
    0, 1, 2, 3, 4,
  ]);

  // Step 5: Notifications
  const [phone, setPhone] = useState("");
  const [morningCheckIn, setMorningCheckIn] = useState(true);
  const [eveningCheckIn, setEveningCheckIn] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  if (!user) return null;

  async function handleComplete() {
    if (!user) return;

    // 1. Update user profile
    await updateUser({
      userId: user._id,
      name: name.trim() || user.name,
      phone: phone.trim() || undefined,
      isOnboarded: true,
      notificationPreferences: {
        pushEnabled: true,
        smsEnabled,
        webPushEnabled: true,
        morningCheckIn,
        eveningCheckIn,
      },
    });

    // 2. Create goal with milestones
    if (goalTitle.trim()) {
      await createGoal({
        userId: user._id,
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: goalCategory,
        deadline: goalDeadline || undefined,
        milestones: milestones.map((m) => ({
          id: m.id,
          title: m.title,
          deadline: m.deadline,
          completed: false,
        })),
      });
    }

    // 3. Set up mentor board
    const chosenMentors = selectedMentors.map((i) => DEFAULT_MENTORS[i]);
    if (chosenMentors.length > 0) {
      await upsertBoard({ userId: user._id, mentors: chosenMentors });
    }

    // Navigate to first coaching session
    navigate("/chat");
  }

  function addMilestone() {
    if (!newMilestone.trim()) return;
    setMilestones([
      ...milestones,
      {
        id: Math.random().toString(36).substring(2, 15),
        title: newMilestone.trim(),
      },
    ]);
    setNewMilestone("");
  }

  function removeMilestone(id: string) {
    setMilestones(milestones.filter((m) => m.id !== id));
  }

  const canAdvance = () => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return goalTitle.trim().length > 0;
      case 2:
        return true; // milestones are optional
      case 3:
        return true; // mentors are optional
      case 4:
        return true; // notifications are optional
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary-500" : "bg-gray-800"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome to Rosebud
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                I'm your personal goal coach. I'll use every tool at my disposal
                to help you become who you want to be.
              </p>
              <p className="text-gray-500 mt-4 text-sm">
                Fair warning: I'm ruthlessly caring. I'll celebrate your wins
                and I won't let excuses slide.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What should I call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full text-lg"
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) =>
                  e.key === "Enter" && canAdvance() && setStep(1)
                }
              />
            </div>
          </div>
        )}

        {/* Step 1: First Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                What's the ONE thing, {name}?
              </h1>
              <p className="text-gray-400 mt-2">
                If you could only achieve one thing in the next 12 weeks, what
                would it be? Be specific.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Your goal
              </label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="input w-full"
                placeholder="e.g., Launch my side business"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Why does this matter?
              </label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="What changes when you achieve this? Why now?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGoalCategory(cat)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        goalCategory === cat
                          ? "bg-primary-600/20 text-primary-400 border border-primary-600/50"
                          : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Milestones */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Break it down
              </h1>
              <p className="text-gray-400 mt-2">
                What are the key steps to achieve "{goalTitle}"? Think 3-5
                milestones.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                className="input flex-1"
                placeholder="e.g., Complete market research"
                onKeyDown={(e) => e.key === "Enter" && addMilestone()}
                autoFocus
              />
              <button
                type="button"
                onClick={addMilestone}
                className="btn-primary px-4"
              >
                Add
              </button>
            </div>

            {milestones.length > 0 ? (
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3"
                  >
                    <span className="text-gray-600 text-sm font-mono">
                      {i + 1}
                    </span>
                    <span className="text-gray-300 flex-1">{m.title}</span>
                    <button
                      onClick={() => removeMilestone(m.id)}
                      className="text-gray-600 hover:text-red-400"
                    >
                      <svg
                        className="w-4 h-4"
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
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 text-sm">
                No milestones yet. Add some to track your progress.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Council of Mentors */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Your Council of Mentors
              </h1>
              <p className="text-gray-400 mt-2">
                Choose mentors whose perspective you value. During coaching
                sessions, I can channel their voice.
              </p>
            </div>

            <div className="space-y-3">
              {DEFAULT_MENTORS.map((mentor, i) => (
                <button
                  key={mentor.name}
                  type="button"
                  onClick={() =>
                    setSelectedMentors((prev) =>
                      prev.includes(i)
                        ? prev.filter((idx) => idx !== i)
                        : [...prev, i]
                    )
                  }
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedMentors.includes(i)
                      ? "bg-primary-600/10 border-primary-600/50 text-white"
                      : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{mentor.name}</span>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {mentor.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedMentors.includes(i)
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-600"
                      }`}
                    >
                      {selectedMentors.includes(i) && (
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
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-600">
              You can add custom mentors later in Settings.
            </p>
          </div>
        )}

        {/* Step 4: Notification Preferences */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                How ruthless should I be?
              </h1>
              <p className="text-gray-400 mt-2">
                I use a 5-level escalation system. It starts with gentle nudges
                and goes up to direct confrontation if you ghost your goals.
              </p>
            </div>

            <div className="space-y-3">
              <NotifToggle
                label="Morning Check-In"
                description="'What's your #1 priority today?'"
                checked={morningCheckIn}
                onChange={setMorningCheckIn}
              />
              <NotifToggle
                label="Evening Check-In"
                description="'How did today go? What did you do?'"
                checked={eveningCheckIn}
                onChange={setEveningCheckIn}
              />
              <NotifToggle
                label="SMS Escalation"
                description="Text messages when you've been silent 3+ days (nuclear option)"
                checked={smsEnabled}
                onChange={setSmsEnabled}
              />
            </div>

            {smsEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number (for SMS)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                  placeholder="+1234567890"
                />
              </div>
            )}

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">
                <strong className="text-gray-300">Escalation levels:</strong>
              </p>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>1. Gentle nudge — friendly check-in</p>
                <p>2. Direct question — "Did you do X today?"</p>
                <p>3. Tough love — "You've skipped 2 days. What's going on?"</p>
                <p>4. SMS alert — "You committed to X. You haven't done it."</p>
                <p>5. Nuclear — "You said this goal matters. Prove it."</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Ready */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">🌹</div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                You're all set, {name}
              </h1>
              <p className="text-gray-400 mt-3 text-lg">
                Your goal is "{goalTitle}" with {milestones.length} milestones.
                {selectedMentors.length > 0
                  ? ` Your council has ${selectedMentors.length} mentors.`
                  : ""}
              </p>
              <p className="text-gray-500 mt-4">
                Let's start with a coaching session. I want to understand where
                you are and map out your first week.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button onClick={handleComplete} className="btn-primary px-8">
              Start Coaching Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary-600" : "bg-gray-700"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
