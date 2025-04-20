"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/useAuth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { useCurrentUser } = useAuth();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout isAdmin={user.role === "admin"} user={user}>
      {children}
    </DashboardLayout>
  );
}
