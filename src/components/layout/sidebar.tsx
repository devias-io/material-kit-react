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
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      submenu: [
        { title: "Overview", href: "/accounts" },
        { title: "New Challenge", href: "/accounts/new" },
      ],
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
    // Admin only items
    {
      title: "User Management",
      href: "/admin/users",
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

  // Filter items based on user role
  const filteredItems = sidebarItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="rounded-full bg-primary p-1">
            <img src="/logo-white.svg" alt="XPIPS" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-primary">XPIPS</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {filteredItems.map((item) => {
            // Check if this route or any of its children is active
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.submenu?.some(
                (submenu) =>
                  pathname === submenu.href ||
                  pathname.startsWith(`${submenu.href}/`)
              ) ??
                false);

            if (item.submenu) {
              // Get the default open value for the accordion
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
                        "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "transparent"
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
                          const isSubActive =
                            pathname === submenu.href ||
                            pathname.startsWith(`${submenu.href}/`);
                          return (
                            <Link
                              key={`${item.title}-${submenu.title}`}
                              href={submenu.href}
                              className={cn(
                                "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                isSubActive
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "transparent"
                              )}
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
                  "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "transparent"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {!isAdmin && (
        <div className="border-t p-4">
          <Button variant="default" className="w-full justify-start gap-2">
            <PlusCircle className="h-4 w-4" />
            New Challenge
          </Button>
        </div>
      )}
    </div>
  );
}
