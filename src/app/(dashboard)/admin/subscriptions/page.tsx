"use client";
import React, { useState } from "react";
import {
  Users,
  Target,
  AlertTriangle,
  Calendar,
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  FileSpreadsheet,
} from "lucide-react";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

interface SubscriptionStats {
  quotaLimit: number;
  activeAccounts: number;
  targetReached: number;
  violatedAccounts: number;
  totalIssuedAccounts: number;
  successRate: number;
}

const SubscriptionsPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Sample data - replace with actual data
  const stats: SubscriptionStats = {
    quotaLimit: 1000,
    activeAccounts: 456,
    targetReached: 234,
    violatedAccounts: 45,
    totalIssuedAccounts: 735,
    successRate: 31.8,
  };

  const handleGenerateReport = () => {
    // Implement PDF generation logic
    console.log("Generating report for:", dateRange);
  };

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      {/* Header Section */}
      <div className="mb-8">
        <Title title="Subscription Overview" />
        <Description description="Monitor subscription metrics and generate statistics" />
      </div>

      {/* Details Section */}
      <div className="mb-8">
        <h2 className="text-2xl   font-semibold mb-4 text-black dark:text-[#f6f9fa]">
          Subscription Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quota Card */}
          <div
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                       backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                       dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                           group-hover:animate-glow"
              >
                <Users className="w-6 h-6 text-teal-500 dark:text-[#12e9ee]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/60  ">
                  Available Quota
                </p>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-[#12e9ee]">
                  {stats.quotaLimit}
                </h3>
              </div>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-[#062f3a] rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 dark:bg-[#12e9ee] transition-all duration-300
                           dark:glow-teal"
                style={{
                  width: `${(stats.activeAccounts / stats.quotaLimit) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60 mt-2  ">
              {stats.quotaLimit - stats.activeAccounts} accounts remaining
            </p>
          </div>

          {/* Active Accounts Card */}
          <div
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                       backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                       dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                           group-hover:animate-glow"
              >
                <UserCheck className="w-6 h-6 text-teal-500 dark:text-[#12e9ee]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/60  ">
                  Active Accounts
                </p>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-[#12e9ee]">
                  {stats.activeAccounts}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60  ">
              {(
                (stats.activeAccounts / stats.totalIssuedAccounts) *
                100
              ).toFixed(1)}
              % of total issued
            </p>
          </div>

          {/* Target Reached Card */}
          <div
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                       backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                       dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                           group-hover:animate-glow"
              >
                <Target className="w-6 h-6 text-teal-500 dark:text-[#12e9ee]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/60  ">
                  Target Reached
                </p>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-[#12e9ee]">
                  {stats.targetReached}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60  ">
              Success rate: {stats.successRate}%
            </p>
          </div>

          {/* Violated Accounts Card */}
          <div
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                       backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                       dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                           group-hover:animate-glow"
              >
                <UserX className="w-6 h-6 text-teal-500 dark:text-[#12e9ee]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/60  ">
                  Violated Accounts
                </p>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-[#12e9ee]">
                  {stats.violatedAccounts}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60  ">
              {(
                (stats.violatedAccounts / stats.totalIssuedAccounts) *
                100
              ).toFixed(1)}
              % violation rate
            </p>
          </div>

          {/* Total Issued Accounts Card */}
          <div
            className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                       dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                       rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                       backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                       dark:hover:shadow-[#12e9ee]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                           group-hover:animate-glow"
              >
                <FileSpreadsheet className="w-6 h-6 text-teal-500 dark:text-[#12e9ee]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/60  ">
                  Total Issued
                </p>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-[#12e9ee]">
                  {stats.totalIssuedAccounts}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#f6f9fa]/60  ">
              All time total issued accounts
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div
        className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                   dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                   rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 p-6 
                   backdrop-blur-sm transition-all duration-300"
      >
        <h2 className="text-2xl   font-semibold mb-6 text-black dark:text-[#f6f9fa]">
          Statistics Range
        </h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label
              className="block text-sm   font-medium mb-2 
                          text-gray-700 dark:text-[#f6f9fa]/80"
            >
              Start Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                               text-teal-500 dark:text-[#12e9ee]"
              />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                        rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                        dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                        focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                          transition-all duration-300"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              className="block text-sm   font-medium mb-2 
                          text-gray-700 dark:text-[#f6f9fa]/80"
            >
              End Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                               text-teal-500 dark:text-[#12e9ee]"
              />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                        rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                        dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                        focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                          transition-all duration-300"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full md:w-auto px-6 py-2 bg-teal-500 dark:bg-[#12e9ee] 
                      text-white dark:text-[#040a14] rounded-lg 
                      hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                      transition-all duration-300 flex items-center justify-center 
                      gap-2   font-medium shadow-lg 
                      hover:shadow-teal-500/25 dark:hover:shadow-[#12e9ee]/25 
                      dark:glow-teal group"
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-[#f6f9fa]/80  ">
          Generate a detailed PDF report for the selected date range including:
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500 dark:text-[#f6f9fa]/60">
            <li>Account creation statistics</li>
            <li>Success and violation rates</li>
            <li>Target achievement metrics</li>
            <li>Daily/Weekly trends</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
