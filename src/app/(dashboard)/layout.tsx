import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard - Xtreme Construction",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  
  const session = await getServerSession(authOptions);

  
  if (session?.user?.role !== 'admin') {
  
    redirect("/login");
  }

  
  return <section>{children}</section>;
}