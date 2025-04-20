"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  // If not client yet, show nothing to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  // Get current user data from localStorage or could be from an API in a real app
  const user = {
    name: isAdmin ? "Admin User" : "John Doe",
    email: isAdmin ? "admin@xpips.com" : "john@example.com",
    avatar: undefined, // Could set an avatar URL here
  };

  return (
    <DashboardLayout isAdmin={isAdmin} user={user}>
      {children}
    </DashboardLayout>
  );
}
