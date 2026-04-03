import { redirect } from "next/navigation";
import { DASHBOARD_HOME_PATH } from "@/lib/routes";

export default function DashboardPage() {
  redirect(DASHBOARD_HOME_PATH);
}
