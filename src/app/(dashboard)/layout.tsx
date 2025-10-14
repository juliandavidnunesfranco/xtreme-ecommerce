import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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

  return (
    <div className="flex h-[calc(100vh-81px)]">
      <DashboardHeader user={session.user}/>
      <Sidebar />
      <main className="flex-1 overflow-y-hidden">
        {children}
      </main>
    </div>
  );
}