import type { Metadata } from "next";
import { UserSettingsScreen } from "@/components/user-settings/user-settings-screen";

export const metadata: Metadata = {
  title: "User Settings | Lizy",
  description: "Gestiona los datos base y preferencias del usuario.",
};

export default function UserSettingsPage() {
  return <UserSettingsScreen />;
}
