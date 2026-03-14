import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DEFAULT_MENTORS } from "@rosebud/shared/prompts/mentors";

export default function Mentors() {
  const user = useQuery(api.auth.getUser);
  const mentorBoard = useQuery(
    api.mentors.get,
    user ? { userId: user._id } : "skip"
  );
  const upsertBoard = useMutation(api.mentors.upsert);
  const addMentor = useMutation(api.mentors.addMentor);
  const removeMentor = useMutation(api.mentors.removeMentor);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perspective, setPerspective] = useState("");
  const [keyPhrases, setKeyPhrases] = useState("");

  if (!user) return null;

  const mentors = mentorBoard?.mentors ?? [];

  async function handleLoadDefaults() {
    await upsertBoard({
      userId: user!._id,
      mentors: DEFAULT_MENTORS,
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await addMentor({
      userId: user!._id,
      mentor: {
        name: name.trim(),
        description: description.trim(),
        perspective: perspective.trim(),
        keyPhrases: keyPhrases
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      },
    });

    setName("");
    setDescription("");
    setPerspective("");
    setKeyPhrases("");
    setShowForm(false);
  }

  async function handleRemove(mentorName: string) {
    await removeMentor({ userId: user!._id, mentorName });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Council of Mentors</h1>
          <p className="text-gray-500 mt-1">
            Your personal advisory board. The AI can channel their perspectives during sessions.
          </p>
        </div>
        <div className="flex gap-2">
          {mentors.length === 0 && (
            <button onClick={handleLoadDefaults} className="btn-secondary text-sm">
              Load Defaults
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? "Cancel" : "Add Mentor"}
          </button>
        </div>
      </div>

      {/* Add mentor form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="e.g., Elon Musk, Oprah, your grandpa..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
              placeholder="e.g., First principles thinking, bold action"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Perspective
            </label>
            <textarea
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="How would this person approach problems? What's their worldview?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Key Phrases (comma separated)
            </label>
            <input
              type="text"
              value={keyPhrases}
              onChange={(e) => setKeyPhrases(e.target.value)}
              className="input w-full"
              placeholder='e.g., "Think bigger", "What would you do if you couldn\'t fail?"'
            />
          </div>

          <button type="submit" className="btn-primary">
            Add to Council
          </button>
        </form>
      )}

      {/* Mentor cards */}
      {mentors.length === 0 && !showForm ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">Your council is empty.</p>
          <p className="text-gray-600 text-sm mt-1">
            Add mentors whose perspective you value — real people, historical figures, anyone.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={handleLoadDefaults} className="btn-secondary">
              Load Default Council
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Custom Mentor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <div key={mentor.name} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-lg">{mentor.name}</h3>
                  <p className="text-sm text-gray-500">{mentor.description}</p>
                </div>
                <button
                  onClick={() => handleRemove(mentor.name)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-300 mt-3 italic">
                "{mentor.perspective}"
              </p>

              {mentor.keyPhrases.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mentor.keyPhrases.map((phrase) => (
                    <span
                      key={phrase}
                      className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
