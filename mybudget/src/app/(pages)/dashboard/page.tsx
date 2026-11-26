import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — MyBudget",
  description:
    "Your monthly income, expenses, savings goals and cash flow in one budget dashboard.",
};

export default function Dashboard() {
  return <DashboardPage />;
}
