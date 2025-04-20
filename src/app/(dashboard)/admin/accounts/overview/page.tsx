"use client";
import React, { useState } from "react";
import { Search, Filter, Eye, Key, ChartLine } from "lucide-react";
import Link from "next/link";

interface Account {
  accountNumber: string;
  program: string;
  endDate: string;
  balance: number;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED" | "VIOLATED";
  credentials: any;
}

const AccountsOverview = () => {
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCredentials, setActiveCredentials] = useState<string | null>(
    null
  );

  const accounts: Account[] = [
    {
      accountNumber: "MT5-12345a",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    {
      accountNumber: "MT5-12a345",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    {
      accountNumber: "MT5a-12345",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    {
      accountNumber: "MTa5-12345",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    {
      accountNumber: "MT5-123a45",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    {
      accountNumber: "MaT5-12345",
      program: "2STEP10KPHASE1",
      endDate: "2024-04-20",
      balance: 10500,
      status: "ACTIVE",
      credentials: {
        login: "12345",
        password: "pass123",
        server: "XPips-Live",
      },
    },
    // Add more accounts...
  ];

  const programs = [
    "All Programs",
    "2STEP10KPHASE1",
    "HFT25KFUNDED",
    "INSTANT50K",
    // Add more programs...
  ];

  const getStatusColor = (status: Account["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-400";
      case "INACTIVE":
        return "bg-gray-100 text-gray-700 dark:bg-gray-400/20 dark:text-gray-400";
      case "COMPLETED":
        return "bg-[#486ebb]/20 text-[#486ebb] dark:bg-[#486ebb]/20 dark:text-[#486ebb]";
      case "VIOLATED":
        return "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-400";
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.accountNumber
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "all" || account.program === selectedProgram;
    return matchesSearch && matchesProgram;
  });

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      <div className="mb-8">
        <h1
          className="text-4xl font-clash-display font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent
                     dark:from-[#12e9ee] dark:to-[#486ebb]"
        >
          Accounts Overview
        </h1>
        <p className="text-gray-600 dark:text-[#f6f9fa]/80 font-clash-grotesk">
          Monitor and manage all trading accounts
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                     dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                     font-clash-grotesk transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <select
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                     dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                     font-clash-grotesk transition-all duration-300 appearance-none"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            {programs.map((program) => (
              <option
                key={program}
                value={program === "All Programs" ? "all" : program}
              >
                {program}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((account) => (
          <div
            key={account.accountNumber}
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                     dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                     rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                     backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                     dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-clash-display font-semibold text-lg text-gray-900 dark:text-[#f6f9fa]">
                  {account.accountNumber}
                </h3>
                <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60 font-clash-grotesk">
                  {account.program}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-clash-grotesk font-medium
                            ${getStatusColor(account.status)} dark:glow-teal`}
              >
                {account.status}
              </span>
            </div>

            <div className="space-y-3 mb-6 font-clash-grotesk">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-[#f6f9fa]/60">
                  End Date
                </span>
                <span className="text-gray-900 dark:text-[#f6f9fa]">
                  {account.endDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-[#f6f9fa]/60">
                  Balance
                </span>
                <span className="font-medium text-teal-600 dark:text-[#12e9ee]">
                  ${account.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveCredentials(account.accountNumber)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                         bg-gray-100 dark:bg-[#12e9ee]/10 text-gray-700 dark:text-[#12e9ee]
                         rounded-lg hover:bg-gray-200 dark:hover:bg-[#12e9ee]/20 
                         transition-all duration-300 font-clash-grotesk"
              >
                <Key className="w-4 h-4" />
                <span>Credentials</span>
              </button>
              <Link
                href={`/admin/accounts/${account.accountNumber}/statistics`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                         bg-teal-500 dark:bg-[#12e9ee] text-white dark:text-[#040a14]
                         rounded-lg hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                         transition-all duration-300 font-clash-grotesk dark:glow-teal"
              >
                <ChartLine className="w-4 h-4" />
                <span>Statistics</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-[#f6f9fa]/60 font-clash-grotesk">
          No accounts found matching your criteria.
        </div>
      )}

      {/* Credentials Modal */}
      {activeCredentials && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-[#040a14]/80 
                     backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            className="bg-white dark:dark-card shadow-xl dark:shadow-[#12e9ee]/10
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 
                       p-6 w-full max-w-md animate-in fade-in duration-200"
          >
            <h3
              className="text-xl font-clash-display font-semibold mb-4 
                        text-gray-900 dark:text-[#f6f9fa]"
            >
              MT5 Credentials
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  className="block text-sm text-gray-500 dark:text-[#f6f9fa]/60 
                               font-clash-grotesk mb-1"
                >
                  Login
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    accounts.find((a) => a.accountNumber === activeCredentials)
                      ?.credentials?.login
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                         rounded-lg bg-gray-50 dark:bg-[#040a14] text-gray-800 
                         dark:text-[#f6f9fa] font-clash-grotesk"
                />
              </div>
              <div>
                <label
                  className="block text-sm text-gray-500 dark:text-[#f6f9fa]/60 
                               font-clash-grotesk mb-1"
                >
                  Password
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    accounts.find((a) => a.accountNumber === activeCredentials)
                      ?.credentials?.password
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                         rounded-lg bg-gray-50 dark:bg-[#040a14] text-gray-800 
                         dark:text-[#f6f9fa] font-clash-grotesk"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-[#f6f9fa]/60 font-clash-grotesk mb-1">
                  Server
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    accounts.find((a) => a.accountNumber === activeCredentials)
                      ?.credentials?.server
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                         rounded-lg bg-gray-50 dark:bg-[#040a14] text-gray-800 
                         dark:text-[#f6f9fa] font-clash-grotesk"
                />
              </div>
            </div>
            <button
              onClick={() => setActiveCredentials(null)}
              className="w-full mt-6 px-4 py-2 bg-teal-500 dark:bg-[#12e9ee] 
                      text-white dark:text-[#040a14] rounded-lg 
                      hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                      transition-all duration-300 font-clash-grotesk 
                      dark:glow-teal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsOverview;
