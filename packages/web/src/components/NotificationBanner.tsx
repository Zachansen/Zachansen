import { usePushNotifications } from "../hooks/usePushNotifications";

export default function NotificationBanner() {
  const { isSupported, permission, isSubscribed, subscribe } =
    usePushNotifications();

  // Don't show if not supported, already subscribed, or explicitly denied
  if (!isSupported || isSubscribed || permission === "denied") return null;

  return (
    <div className="bg-primary-600/10 border border-primary-600/30 rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-primary-400">
          Enable notifications
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Get check-in reminders and accountability nudges even when the app is
          closed.
        </p>
      </div>
      <button
        onClick={subscribe}
        className="btn-primary text-sm px-4 py-1.5 shrink-0"
      >
        Enable
      </button>
    </div>
  );
}
