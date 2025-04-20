"use client";
import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

interface Program {
  id: string;
  name: string;
  platform: string;
  balance: number;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  startDate: string;
}

interface User {
  id: string;
  username: string;
  addedOn: string;
  email: string;
  name: string;
  lastIp: string;
  programs: Program[];
}

interface IPAccount {
  userId: string;
  account: string;
  lastUpdated: string;
  balance: number;
  equity: number;
  status:
    | "INACTIVE"
    | "ACTIVE"
    | "TARGET REACHED"
    | "VIOLATION - OEDD"
    | "PAYOUT REQUESTED";
}

const UsersPage = () => {
  const [activeTab, setActiveTab] = useState<"users" | "ip">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Updated sample data with programs
  const users: User[] = [
    {
      id: "1",
      username: "trader123",
      addedOn: "2024-03-20",
      email: "trader@example.com",
      name: "John Doe",
      lastIp: "192.168.1.1",
      programs: [
        {
          id: "p1",
          name: "2STEP10KPHASE1",
          platform: "MT5",
          balance: 10000,
          status: "ACTIVE",
          startDate: "2024-03-15",
        },
        {
          id: "p2",
          name: "HFT25KFUNDED",
          platform: "MT5",
          balance: 25000,
          status: "COMPLETED",
          startDate: "2024-02-20",
        },
      ],
    },
    // Add more users...
  ];

  const ipAccounts: IPAccount[] = [
    {
      userId: "trader123",
      account: "MT5-12345",
      lastUpdated: "2024-03-20 15:30:00",
      balance: 10000,
      equity: 10500,
      status: "ACTIVE",
    },
    // Add more accounts...
  ];

  const getStatusColor = (status: IPAccount["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-400";
      case "TARGET REACHED":
        return "bg-[#486ebb]/20 text-[#486ebb]";
      case "VIOLATION - OEDD":
        return "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-400";
      case "PAYOUT REQUESTED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-400";
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getProgramStatusColor = (status: Program["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-400";
      case "COMPLETED":
        return "bg-[#486ebb]/20 text-[#486ebb] ";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-400";
    }
  };

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      <div className="flex justify-between items-center mb-8">
        <div className="mb-8">
          <Title title="Users & Accounts" />
          <Description description="Manage users and monitor account activities" />
        </div>
        <Link
          href="/admin/users/add"
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 dark:bg-[#12e9ee] 
                   text-white dark:text-[#040a14] rounded-lg 
                   hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                   transition-all duration-300   
                   dark:glow-teal group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Add User</span>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg transition-all duration-300   ${
            activeTab === "users"
              ? "bg-teal-500 dark:bg-[#12e9ee] text-white dark:text-[#040a14] dark:glow-teal"
              : "bg-gray-100 dark:bg-[#062f3a] text-gray-600 dark:text-[#f6f9fa]/80 hover:bg-gray-200 dark:hover:bg-[#12e9ee]/10"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("ip")}
          className={`px-4 py-2 rounded-lg transition-all duration-300   ${
            activeTab === "ip"
              ? "bg-teal-500 dark:bg-[#12e9ee] text-white dark:text-[#040a14] dark:glow-teal"
              : "bg-gray-100 dark:bg-[#062f3a] text-gray-600 dark:text-[#f6f9fa]/80 hover:bg-gray-200 dark:hover:bg-[#12e9ee]/10"
          }`}
        >
          IP Addresses
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <input
            type="text"
            placeholder={`Search ${
              activeTab === "users" ? "users" : "accounts"
            }...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                     dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                       transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div
        className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                   dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                   rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 
                   overflow-hidden backdrop-blur-sm"
      >
        <div className="overflow-x-auto">
          {activeTab === "users" ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#12e9ee]/20">
                  <th className="w-10 px-6 py-4"></th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    User Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    Added on
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    Last Dashboard IP
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr
                      className="border-b border-gray-200 dark:border-[#12e9ee]/20 
                               hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserExpansion(user.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-[#12e9ee]/10 
                                   rounded-lg transition-colors group"
                        >
                          {expandedUsers.includes(user.id) ? (
                            <ChevronDown
                              className="w-4 h-4 text-gray-400 dark:text-[#f6f9fa]/60 
                                                group-hover:text-teal-500 dark:group-hover:text-[#12e9ee]"
                            />
                          ) : (
                            <ChevronRight
                              className="w-4 h-4 text-gray-400 dark:text-[#f6f9fa]/60 
                                                 group-hover:text-teal-500 dark:group-hover:text-[#12e9ee]"
                            />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4   font-medium text-gray-900 dark:text-[#f6f9fa]">
                        {user.username}
                      </td>
                      <td className="px-6 py-4">{user.addedOn}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.name}</td>
                      <td className="px-6 py-4">{user.lastIp}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-[#486ebb] hover:text-[#12e9ee] 
                                         transition-colors group"
                          >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-400 
                                         transition-colors group"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUsers.includes(user.id) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="bg-gray-50/50 dark:bg-[#040a14]/50 px-4 py-2"
                        >
                          <div
                            className="rounded-lg overflow-hidden border border-gray-200 
                                      dark:border-[#12e9ee]/20 bg-white dark:bg-[#062f3a]"
                          >
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-gray-100 dark:bg-[#12e9ee]/10">
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#f6f9fa]/80">
                                    Program Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#f6f9fa]/80">
                                    Platform
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#f6f9fa]/80">
                                    Balance
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#f6f9fa]/80">
                                    Start Date
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#f6f9fa]/80">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {user.programs.map((program) => (
                                  <tr
                                    key={program.id}
                                    className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 transition-colors"
                                  >
                                    <td className="px-6 py-3 text-sm">
                                      {program.name}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                      {program.platform}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                      ${program.balance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                      {program.startDate}
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                      <span
                                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getProgramStatusColor(
                                          program.status
                                        )}`}
                                      >
                                        {program.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Account
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Equity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ipAccounts.map((account) => (
                  <tr
                    key={account.account}
                    className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{account.userId}</td>
                    <td className="px-6 py-4">{account.account}</td>
                    <td className="px-6 py-4">{account.lastUpdated}</td>
                    <td className="px-6 py-4">
                      ${account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      ${account.equity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          account.status
                        )}`}
                      >
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between  ">
        <div className="text-sm text-gray-500 dark:text-[#f6f9fa]/60">
          Showing {itemsPerPage} items per page
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-700 
                     dark:text-[#f6f9fa] hover:bg-gray-50 dark:hover:bg-[#12e9ee]/10 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-700 
                     dark:text-[#f6f9fa] hover:bg-gray-50 dark:hover:bg-[#12e9ee]/10 
                     transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
