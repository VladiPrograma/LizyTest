import type { Metadata } from "next";
import { PaymentsHistoryScreen } from "@/features/payments-history/payments-history-screen";

export const metadata: Metadata = {
  title: "Payments History | Lizy",
  description: "Gestiona y revisa todos los movimientos de tu cuenta.",
};

export default function PaymentsHistoryPage() {
  return <PaymentsHistoryScreen />;
}
