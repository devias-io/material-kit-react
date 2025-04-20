"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export default function DashboardLayout({
  children,
  isAdmin = false,
  user = {
    name: "John Doe",
    email: "john@example.com",
  },
}: DashboardLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-3 z-40 rounded-full md:hidden"
        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
      >
        {showMobileSidebar ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile sidebar backdrop */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-0">
        <Header
          userName={user.name}
          userEmail={user.email}
          avatarUrl={user.avatar}
        />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
