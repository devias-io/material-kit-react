"use client";

import Link from "next/link";
import {
  BellIcon,
  SearchIcon,
  LogOut,
  Settings,
  User as UserIcon,
  Mail,
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { User as UserType } from "@/types/user.types";

interface HeaderProps {
  user: UserType;
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const { logout } = useAuth();

  const userName = `${user?.firstName} ${user?.lastName}`.trim();
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 flex h-14 items-center border-b border-gray-200 dark:border-[#12e9ee]/10 
                     bg-white dark:bg-gradient-to-r dark:from-[#062f3a] dark:to-[#083c5a] 
                     px-4 lg:px-6 backdrop-blur-sm shadow-sm dark:shadow-[#12e9ee]/5"
    >
      <div className="flex flex-1 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="relative w-full max-w-md">
          <SearchIcon
            className="absolute left-2.5 top-2.5 h-4 w-4 
                              text-gray-400 dark:text-[#12e9ee]"
          />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-8 rounded-full md:w-80 lg:w-64 xl:w-96 
                     border-gray-200 dark:border-[#12e9ee]/20 
                     bg-white dark:bg-[#062f3a]/50
                     text-gray-900 dark:text-[#f6f9fa]
                     placeholder:text-gray-500 dark:placeholder:text-[#f6f9fa]/50
                     focus:ring-2 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50
                       transition-all duration-300"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-gray-600 dark:text-[#f6f9fa]/70
                   hover:bg-gray-100 dark:hover:bg-[#12e9ee]/10
                   hover:text-gray-900 dark:hover:text-[#12e9ee]
                   transition-all duration-300"
          aria-label="Notifications"
        >
          <div className="relative">
            <BellIcon className="h-5 w-5" />
            <span
              className="absolute -top-1 -right-1 h-2 w-2 rounded-full
                         bg-teal-500 dark:bg-[#12e9ee] animate-pulse"
            />
          </div>
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full hover:ring-2 
                       hover:ring-teal-500 dark:hover:ring-[#12e9ee]
                       transition-all duration-300"
              aria-label="User menu"
            >
              <Avatar
                className="h-8 w-8 border-2 border-transparent
                              hover:border-teal-500 dark:hover:border-[#12e9ee]
                              transition-all duration-300"
              >
                <AvatarImage src={user?.imageUri} alt={userName} />
                <AvatarFallback
                  className="bg-teal-500 dark:bg-[#12e9ee] 
                                       text-white dark:text-[#040a14]
                                        "
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 dark:dark-card border-gray-200 
                                      dark:border-[#12e9ee]/10 bg-white 
                                      dark:bg-gradient-to-br dark:from-[#062f3a] 
                                      dark:to-[#083c5a]"
          >
            <DropdownMenuLabel className=" ">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-[#f6f9fa]">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#f6f9fa]/70">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:border-[#12e9ee]/10" />
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="cursor-pointer flex w-full items-center
                             text-gray-700 dark:text-[#f6f9fa]
                             hover:text-teal-500 dark:hover:text-[#12e9ee]
                               transition-colors"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="cursor-pointer flex w-full items-center
                             text-gray-700 dark:text-[#f6f9fa]
                             hover:text-teal-500 dark:hover:text-[#12e9ee]
                               transition-colors"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/messages"
                className="cursor-pointer flex w-full items-center
                             text-gray-700 dark:text-[#f6f9fa]
                             hover:text-teal-500 dark:hover:text-[#12e9ee]
                               transition-colors"
              >
                <Mail className="mr-2 h-4 w-4" />
                <span>Messages</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:border-[#12e9ee]/10" />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 dark:text-red-400
                       hover:text-red-700 dark:hover:text-red-300
                         transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
