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
    
      <Sidebar />
      <div className="flex-1 flex flex-col">
      <DashboardHeader user={session?.user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {children}
        </main>
      </div>
      
    </div>
  );
}