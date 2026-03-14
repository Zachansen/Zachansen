import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function Settings() {
  const user = useQuery(api.auth.getUser);
  const updateUser = useMutation(api.auth.updateUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setTimezone(user.timezone);
    }
  }, [user]);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateUser({
      userId: user!._id,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      timezone: timezone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleNotificationToggle(
    key: keyof typeof user.notificationPreferences,
    value: boolean
  ) {
    await updateUser({
      userId: user!._id,
      notificationPreferences: {
        ...user!.notificationPreferences,
        [key]: value,
      },
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your profile and notification preferences.</p>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Phone (for SMS notifications)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input w-full"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input w-full"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Phoenix">Arizona Time</option>
            <option value="Pacific/Honolulu">Hawaii Time</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">
            Save Profile
          </button>
          {saved && <span className="text-sm text-green-400">Saved!</span>}
        </div>
      </form>

      {/* Notifications */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <p className="text-sm text-gray-500">
          Control how the app holds you accountable.
        </p>

        <div className="space-y-3">
          <Toggle
            label="Push Notifications"
            description="Browser push notifications for check-ins and nudges"
            checked={user.notificationPreferences.pushEnabled}
            onChange={(v) => handleNotificationToggle("pushEnabled", v)}
          />
          <Toggle
            label="Web Push"
            description="Notifications even when the app is closed"
            checked={user.notificationPreferences.webPushEnabled}
            onChange={(v) => handleNotificationToggle("webPushEnabled", v)}
          />
          <Toggle
            label="SMS (Last Resort)"
            description="Text messages for escalation level 4-5 when you're ghosting your goals"
            checked={user.notificationPreferences.smsEnabled}
            onChange={(v) => handleNotificationToggle("smsEnabled", v)}
          />
          <Toggle
            label="Morning Check-In"
            description="Daily morning notification: 'What's your #1 priority today?'"
            checked={user.notificationPreferences.morningCheckIn}
            onChange={(v) => handleNotificationToggle("morningCheckIn", v)}
          />
          <Toggle
            label="Evening Check-In"
            description="Daily evening notification: 'How did today go?'"
            checked={user.notificationPreferences.eveningCheckIn}
            onChange={(v) => handleNotificationToggle("eveningCheckIn", v)}
          />
        </div>
      </div>

      {/* API Keys info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">API Configuration</h2>
        <p className="text-sm text-gray-500">
          Set these in your <code className="text-gray-400">.env.local</code> file:
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-sm font-mono text-gray-400 space-y-1">
          <p>ANTHROPIC_API_KEY=sk-ant-...</p>
          <p>TWILIO_ACCOUNT_SID=AC...</p>
          <p>TWILIO_AUTH_TOKEN=...</p>
          <p>TWILIO_PHONE_NUMBER=+1...</p>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
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
