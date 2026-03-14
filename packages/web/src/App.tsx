import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Chat from "./pages/Chat";
import Memory from "./pages/Memory";
import Mentors from "./pages/Mentors";
import CheckIns from "./pages/CheckIns";
import Settings from "./pages/Settings";
import { useEffect } from "react";

export default function App() {
  const user = useQuery(api.auth.getUser);
  const createUser = useMutation(api.auth.getOrCreateUser);

  // Auto-create user on first visit
  useEffect(() => {
    if (user === null) {
      createUser({ name: "User" });
    }
  }, [user, createUser]);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:sessionId" element={<Chat />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/checkins" element={<CheckIns />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
