"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Download,
  Award,
  Wallet,
  Settings,
  CreditCard,
  MessageSquare,
  PlusCircle,
  FileCheck,
  Info,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Logo from "./logo";

interface SidebarProps {
  isAdmin?: boolean;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: { title: string; href: string }[];
  adminOnly?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const handleCloseSidebar = () => {
    const event = new CustomEvent("toggleSidebar");
    window.dispatchEvent(event);
  };

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Accounts",
      href: "/accounts",
      icon: <CreditCard className="h-5 w-5" />,
      submenu: [{ title: "Overview", href: "/accounts" }],
    },
    {
      title: "Withdrawals",
      href: "/withdrawals",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "Certificates",
      href: "/certificates",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Downloads",
      href: "/downloads",
      icon: <Download className="h-5 w-5" />,
    },
    {
      title: "Contracts",
      href: "/contracts",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "KYC Verification",
      href: "/kyc",
      icon: <FileCheck className="h-5 w-5" />,
    },
    {
      title: "Subscriptions",
      href: "/admin/subscriptions",
      icon: <Info className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      title: "Users & Accounts",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      submenu: [
        { title: "Management", href: "/admin/users" },
        { title: "Add user", href: "/admin/users/add" },
      ],
      adminOnly: true,
    },
    {
      title: "Accounts Overview",
      href: "/admin/accounts/overview",
      icon: <Users className="h-5 w-5" />,

      adminOnly: true,
    },
    {
      title: "Program Management",
      href: "/admin/programs",
      icon: <Settings className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      title: "Message Templates",
      href: "/admin/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      adminOnly: true,
    },
    {
      title: "Leaderboard",
      href: "/admin/leaderboard",
      icon: <Award className="h-5 w-5" />,
      adminOnly: true,
    },
  ];

  const filteredItems = sidebarItems.filter((item) =>
    isAdmin ? item.adminOnly : !item.adminOnly
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-white dark:bg-[#040a14] border-r border-gray-200 dark:border-[#12e9ee]/10">
      <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-[#12e9ee]/10 bg-white dark:bg-gradient-to-l dark:from-[#062f3a] dark:to-[#083c5a]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
        >
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleCloseSidebar}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2 bg-white dark:bg-gradient-to-b dark:from-[#062f3a] dark:to-[#083c5a]">
        <nav className="grid gap-1 px-2">
          {filteredItems.map((item) => {
            const isSubActive = item.submenu?.some(
              (submenu) => pathname === submenu.href
            );

            const isActive =
              (!item.submenu &&
                (pathname === item.href ||
                  pathname.startsWith(`${item.href}/`))) ||
              isSubActive;

            if (item.submenu) {
              const defaultOpen = item.submenu.some(
                (submenu) =>
                  pathname === submenu.href ||
                  pathname.startsWith(`${submenu.href}/`)
              )
                ? item.title
                : undefined;

              return (
                <Accordion
                  key={item.title}
                  type="single"
                  collapsible
                  defaultValue={defaultOpen}
                  className="border-none"
                >
                  <AccordionItem value={item.title} className="border-none">
                    <AccordionTrigger
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm transition-all duration-300",
                        isActive
                          ? "bg-teal-500/10 dark:bg-[#12e9ee]/10 text-teal-500 dark:text-[#12e9ee]"
                          : "text-gray-700 dark:text-[#f6f9fa]/70 hover:bg-gray-100 dark:hover:bg-[#12e9ee]/5 hover:text-gray-900 dark:hover:text-[#f6f9fa]"
                      )}
                    >
                      <div className="flex items-center gap-x-2">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-0">
                      <div className="flex flex-col gap-1 pl-9">
                        {item.submenu.map((submenu) => {
                          const isSubmenuActive = pathname === submenu.href;
                          return (
                            <Link
                              key={`${item.title}-${submenu.title}`}
                              href={submenu.href}
                              className={cn(
                                "flex items-center rounded-md px-3 py-2 text-sm transition-all duration-300",
                                isSubmenuActive
                                  ? "bg-teal-500/10 dark:bg-[#12e9ee]/10 text-teal-500 dark:text-[#12e9ee] font-medium"
                                  : "text-gray-700 dark:text-[#f6f9fa]/70 hover:bg-gray-100 dark:hover:bg-[#12e9ee]/5 hover:text-gray-900 dark:hover:text-[#f6f9fa]"
                              )}
                              onClick={handleCloseSidebar}
                            >
                              {submenu.title}
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm transition-all duration-300",
                  isActive
                    ? "bg-teal-500/10 dark:bg-[#12e9ee]/10 text-teal-500 dark:text-[#12e9ee] font-medium"
                    : "text-gray-700 dark:text-[#f6f9fa]/70 hover:bg-gray-100 dark:hover:bg-[#12e9ee]/5 hover:text-gray-900 dark:hover:text-[#f6f9fa]"
                )}
                onClick={handleCloseSidebar}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-[#12e9ee]/10 p-4 bg-white dark:bg-gradient-to-r dark:from-[#062f3a] dark:to-[#083c5a]">
        <Button className="w-full justify-start gap-2 bg-teal-500 dark:bg-[#12e9ee] text-white dark:text-[#040a14] hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 transition-all duration-300 dark:glow-teal group">
          <PlusCircle className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          New Challenge
        </Button>
      </div>
    </div>
  );
}
