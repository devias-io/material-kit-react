"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";
import {
  BarChart3,
  CreditCard,
  Calendar,
  DollarSign,
  Settings,
  Activity,
} from "lucide-react";

const page = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="mb-8">
          <Title title="Account Overview" />
          <Description description="View and manage your trading account details and settings." />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-gray-200 dark:border-[#12e9ee]/20 
                     hover:bg-gray-100 dark:hover:bg-[#12e9ee]/10 
                     text-gray-700 dark:text-[#f6f9fa] 
                     transition-all duration-300"
          >
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button
            variant="outline"
            className="bg-teal-500 dark:bg-[#12e9ee] text-white dark:text-[#040a14] 
                     hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                     transition-all duration-300 dark:glow-teal"
          >
            <Activity className="mr-2 h-4 w-4" />
            View Statistics
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Status Card */}
        <Card
          className="dark:dark-card border-l-4 border-l-[#12e9ee] 
                    bg-white dark:bg-gradient-to-br dark:from-[#062f3a] 
                    dark:to-[#083c5a] shadow-lg dark:shadow-[#12e9ee]/5"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-[#f6f9fa]">
                Account Status
              </h2>
              <Badge
                variant="outline"
                className="bg-teal-500/10 dark:bg-[#12e9ee]/10 text-teal-500 dark:text-[#12e9ee] 
                         border-teal-500/20 dark:border-[#12e9ee]/20"
              >
                Active
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  Account Name
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-[#f6f9fa]">
                  INSTANTFUNDED10K
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Details Card */}
        <Card
          className="dark:dark-card border-l-4 border-l-[#12e9ee] 
                    bg-white dark:bg-gradient-to-br dark:from-[#062f3a] 
                    dark:to-[#083c5a] shadow-lg dark:shadow-[#12e9ee]/5"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-[#f6f9fa]">
                Account Details
              </h2>
              <CreditCard className="h-5 w-5 text-gray-500 dark:text-[#f6f9ee]/70" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  Account Number
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-[#f6f9fa]">
                  7415395543
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  End Date
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-[#f6f9fa]/70" />
                  <span className="text-sm font-medium text-gray-900 dark:text-[#f6f9fa]">
                    Jan 12, 2028
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  Balance
                </span>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500 dark:text-[#f6f9fa]/70" />
                  <span className="text-sm font-medium text-gray-900 dark:text-[#f6f9fa]">
                    9,807.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Options Card */}
        <Card
          className="dark:dark-card border-l-4 border-l-[#12e9ee] 
                    bg-white dark:bg-gradient-to-br dark:from-[#062f3a] 
                    dark:to-[#083c5a] shadow-lg dark:shadow-[#12e9ee]/5"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-[#f6f9fa]">
                Additional Options
              </h2>
              <Settings className="h-5 w-5 text-gray-500 dark:text-[#f6f9ee]/70" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  Auto Trading
                </span>
                <Switch className="data-[state=checked]:bg-teal-500 dark:data-[state=checked]:bg-[#12e9ee]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#f6f9fa]/70">
                  Statistics Access
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-teal-500/10 dark:bg-[#12e9ee]/10 text-teal-500 dark:text-[#12e9ee] 
                           border-teal-500/20 dark:border-[#12e9ee]/20 
                           hover:bg-teal-500/20 dark:hover:bg-[#12e9ee]/20"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default page;
