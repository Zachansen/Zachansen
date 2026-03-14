import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#e2e8f0",
        contentStyle: { backgroundColor: "#020617" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Rosebud" }} />
      <Stack.Screen name="goals" options={{ title: "Goals" }} />
      <Stack.Screen name="chat" options={{ title: "Coaching" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
