"use client";
import React, { useState } from "react";
import { Search, ChevronDown, Trophy, ExternalLink } from "lucide-react";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

interface Trader {
  rank: number;
  username: string;
  accountNumber: string;
  program: string;
  valueGrowth: number;
  status: "ACTIVE" | "TARGET REACHED";
}

const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");

  const programs = [
    "All Programs",
    "HFT100KFUNDED",
    "HFT100KPHASE1",
    "HFT50KPHASE1",
    "HFT25KFUNDED",
    "2STEPPHASE150K",
  ];

  const traders: Trader[] = [
    {
      rank: 1,
      username: "umatok_2451",
      accountNumber: "7415379716",
      program: "HFT100KFUNDED",
      valueGrowth: 1012.87,
      status: "TARGET REACHED",
    },
    {
      rank: 2,
      username: "filipposala02_213",
      accountNumber: "7415347060",
      program: "HFT100KPHASE1",
      valueGrowth: 62.47,
      status: "TARGET REACHED",
    },
    // Add more traders as needed
  ];

  const filteredTraders = traders.filter((trader) => {
    const matchesSearch = trader.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "all" ||
      trader.program.toLowerCase() === selectedProgram.toLowerCase();
    return matchesSearch && matchesProgram;
  });

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500 dark:text-yellow-400";
      case 2:
        return "text-gray-400 dark:text-gray-300";
      case 3:
        return "text-amber-600 dark:text-amber-500";
      default:
        return "text-gray-900 dark:text-[#f6f9fa]";
    }
  };

  const getStatusColor = (status: Trader["status"]) => {
    switch (status) {
      case "TARGET REACHED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-400 dark:glow-teal";
      case "ACTIVE":
        return "bg-[#486ebb]/20 text-[#486ebb] dark:glow-blue";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-400";
    }
  };

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      <div className="mb-8">
        <Title title="Leaderboard" />
        <Description description="Top performing traders in our community" />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <input
            type="text"
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                     dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                       transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 
                     border border-gray-200 dark:border-[#12e9ee]/20 rounded-lg 
                     bg-white dark:bg-[#062f3a] text-gray-800 dark:text-[#f6f9fa] 
                     focus:outline-none focus:ring-2 focus:ring-teal-500 
                     dark:focus:ring-[#12e9ee]/50   
                     transition-all duration-300"
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
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 
                                text-gray-400 dark:text-[#f6f9fa]/60 pointer-events-none"
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#12e9ee]/20">
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Rank
                </th>
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Username
                </th>
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Account Number
                </th>
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Program
                </th>
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Value Growth
                </th>
                <th
                  className="px-6 py-4 text-left text-sm   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Status
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
              {filteredTraders.map((trader) => (
                <tr
                  key={trader.accountNumber}
                  className="border-b border-gray-200 dark:border-[#12e9ee]/20 last:border-b-0 
                           hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {trader.rank <= 3 && (
                        <Trophy
                          className={`w-5 h-5 ${getRankColor(
                            trader.rank
                          )} animate-glow`}
                        />
                      )}
                      <span
                        className={`  font-semibold ${getRankColor(
                          trader.rank
                        )}`}
                      >
                        #{trader.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4   font-medium text-gray-900 dark:text-[#f6f9fa]">
                    {trader.username}
                  </td>
                  <td className="px-6 py-4   text-gray-500 dark:text-[#f6f9fa]/60">
                    {trader.accountNumber}
                  </td>
                  <td className="px-6 py-4   text-gray-900 dark:text-[#f6f9fa]">
                    {trader.program}
                  </td>
                  <td className="px-6 py-4   font-semibold text-teal-500 dark:text-[#12e9ee]">
                    {trader.valueGrowth.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs   
                                 font-medium ${getStatusColor(trader.status)}`}
                    >
                      {trader.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="flex items-center gap-1   text-[#486ebb] 
                                   hover:text-[#12e9ee] transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>View Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
