"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, ArrowUpDown, ShoppingCart } from "lucide-react";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

interface Program {
  id: string;
  name: string;
  platform: string;
  balance: number;
  dailyDrawdown: number;
  overallBalanceDrawdown: number;
  overallEquityDrawdown: number;
  gainTarget: number;
  maxDays: number;
  minDays: number;
}

const ProgramsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Program>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Sample data - replace with your actual data
  const programs: Program[] = [
    {
      id: "1",
      name: "2STEP10KPHASE1",
      platform: "MT5",
      balance: 10000,
      dailyDrawdown: 5,
      overallBalanceDrawdown: 15,
      overallEquityDrawdown: 15,
      gainTarget: 8,
      maxDays: 999,
      minDays: 5,
    },
    // Add more programs...
  ];

  const handleSort = (field: keyof Program) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleNewOrder = (program: Program) => {
    setSelectedProgram(program);
    setIsNewOrderModalOpen(true);
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="mb-8">
          <Title title="Program Management" />
          <Description description="Manage your trading programs and challenges" />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 dark:bg-[#12e9ee] 
                       text-white dark:text-[#040a14] rounded-lg 
                       hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                       transition-all duration-300   
                       dark:glow-teal group whitespace-nowrap"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Create Program</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <input
            type="text"
            placeholder="Search programs..."
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
                   rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 backdrop-blur-sm w-full"
      >
        <div className="overflow-hidden">
          <table className="w-full min-w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#12e9ee]/20">
                <th
                  className="px-3 py-2 text-left text-xs   font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80 whitespace-nowrap"
                >
                  Actions
                </th>
                {[
                  "Program",
                  "Platform",
                  "Balance",
                  "Daily DD",
                  "Overall Balance DD",
                  "Overall Equity DD",
                  "Gain Target",
                  "Max Days",
                  "Min Days",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 text-left text-xs   font-semibold 
                             text-gray-600 dark:text-[#f6f9fa]/80 cursor-pointer hover:text-foreground whitespace-nowrap"
                    onClick={() =>
                      handleSort(
                        header.toLowerCase().replace(" ", "") as keyof Program
                      )
                    }
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((program) => (
                <tr
                  key={program.id}
                  className="border-b border-gray-200 dark:border-[#12e9ee]/20 last:border-b-0 
                           hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1   text-[#486ebb] 
                                 hover:text-[#12e9ee] transition-colors group text-xs"
                      >
                        <Edit className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleNewOrder(program)}
                        className="flex items-center gap-1   text-teal-500 
                               dark:text-[#12e9ee] hover:text-teal-600 
                               dark:hover:text-[#12e9ee]/90 transition-colors group text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2   font-medium text-gray-900 dark:text-[#f6f9fa] whitespace-nowrap text-sm">
                    {program.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.platform}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    ${program.balance.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.dailyDrawdown}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.overallBalanceDrawdown}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.overallEquityDrawdown}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.gainTarget}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.maxDays}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {program.minDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-8   text-gray-500 dark:text-[#f6f9fa]/60">
          No programs found matching your search.
        </div>
      )}

      {selectedProgram && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-[#040a14]/80 
                   backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            className="bg-white dark:dark-card shadow-xl dark:shadow-[#12e9ee]/10
                     dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                     rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 
                     p-4 sm:p-6 w-full max-w-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl sm:text-2xl   font-bold mb-4 text-gray-900 dark:text-[#f6f9fa]">
              New Order - {selectedProgram.name}
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <div
                    className="p-4 bg-gray-50 dark:bg-[#040a14]/50 rounded-lg mb-4 
                             border border-gray-200 dark:border-[#12e9ee]/20"
                  >
                    <h3 className="  font-medium mb-2 text-gray-900 dark:text-[#f6f9fa]">
                      Program Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm  ">
                      <div>
                        <span className="text-gray-700 dark:text-[#f6f9fa]/80">
                          Balance:
                        </span>
                        <span className="ml-2">
                          ${selectedProgram.balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-700 dark:text-[#f6f9fa]/80">
                          Platform:
                        </span>
                        <span className="ml-2">{selectedProgram.platform}</span>
                      </div>
                      <div>
                        <span className="text-gray-700 dark:text-[#f6f9fa]/80">
                          Daily Drawdown:
                        </span>
                        <span className="ml-2">
                          {selectedProgram.dailyDrawdown}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-700 dark:text-[#f6f9fa]/80">
                          Gain Target:
                        </span>
                        <span className="ml-2">
                          {selectedProgram.gainTarget}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm   font-medium mb-1 
                              text-gray-700 dark:text-[#f6f9fa]/80"
                  >
                    Account Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                               rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                               dark:text-[#f6f9fa]  "
                  >
                    <option value="live">Live</option>
                    <option value="demo">Demo</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm   font-medium mb-1 
                              text-gray-700 dark:text-[#f6f9fa]/80"
                  >
                    Leverage
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                               rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                               dark:text-[#f6f9fa]  "
                  >
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm   font-medium mb-1 
                              text-gray-700 dark:text-[#f6f9fa]/80"
                  >
                    Client Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                           dark:text-[#f6f9fa]  "
                    placeholder="Enter client name"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm   font-medium mb-1 
                              text-gray-700 dark:text-[#f6f9fa]/80"
                  >
                    Client Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                           dark:text-[#f6f9fa]  "
                    placeholder="Enter client email"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label
                    className="block text-sm   font-medium mb-1 
                              text-gray-700 dark:text-[#f6f9fa]/80"
                  >
                    Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                           dark:text-[#f6f9fa]   h-24"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOrderModalOpen(false);
                    setSelectedProgram(null);
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg hover:bg-gray-50 dark:hover:bg-[#12e9ee]/10 
                           transition-colors   text-gray-700 
                           dark:text-[#f6f9fa] order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 dark:bg-[#12e9ee] text-white 
                           dark:text-[#040a14] rounded-lg hover:bg-teal-600 
                           dark:hover:bg-[#12e9ee]/90 transition-all duration-300 
                             dark:glow-teal order-1 sm:order-2"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
