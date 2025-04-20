"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { User as UserType } from "@/types/user.types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  user: UserType;
}

export default function DashboardLayout({
  children,
  isAdmin = false,
  user,
}: DashboardLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="flex min-h-screen relative flex-col md:flex-row">
      {/* Mobile sidebar backdrop */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:fixed ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Header user={user} onMenuClick={toggleSidebar} />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
