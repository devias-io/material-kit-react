"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BadgePercent,
  DollarSign,
  LineChart,
  Target,
  Calendar,
  ChevronUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

// Sample data for the charts
const balanceData = [
  { date: "Feb 01", balance: 10000, equity: 10000 },
  { date: "Feb 05", balance: 10120, equity: 10150 },
  { date: "Feb 10", balance: 10350, equity: 10420 },
  { date: "Feb 15", balance: 10270, equity: 10310 },
  { date: "Feb 20", balance: 10450, equity: 10490 },
  { date: "Feb 25", balance: 10580, equity: 10620 },
  { date: "Mar 01", balance: 10750, equity: 10820 },
  { date: "Mar 05", balance: 10920, equity: 11050 },
  { date: "Mar 10", balance: 11150, equity: 11200 },
  { date: "Mar 15", balance: 11320, equity: 11280 },
];

const tradingData = [
  { date: "Feb", long: 15, short: 8 },
  { date: "Mar", long: 12, short: 14 },
  { date: "Apr", long: 18, short: 10 },
  { date: "May", long: 9, short: 12 },
  { date: "Jun", long: 14, short: 8 },
  { date: "Jul", long: 16, short: 20 },
];

// Sample trading history data
const tradingHistory = [
  {
    id: 1,
    symbol: "EURUSD",
    type: "BUY",
    openPrice: 1.0821,
    closePrice: 1.0875,
    size: 1.25,
    profit: 54.0,
    openTime: "2024-03-12 09:32",
    closeTime: "2024-03-12 14:45",
  },
  {
    id: 2,
    symbol: "GBPUSD",
    type: "SELL",
    openPrice: 1.2654,
    closePrice: 1.2589,
    size: 0.75,
    profit: 48.75,
    openTime: "2024-03-11 15:20",
    closeTime: "2024-03-12 10:15",
  },
  {
    id: 3,
    symbol: "USDJPY",
    type: "BUY",
    openPrice: 149.85,
    closePrice: 150.75,
    size: 1.0,
    profit: 90.0,
    openTime: "2024-03-10 22:15",
    closeTime: "2024-03-11 05:30",
  },
  {
    id: 4,
    symbol: "XAUUSD",
    type: "SELL",
    openPrice: 2018.5,
    closePrice: 2025.75,
    size: 0.1,
    profit: -72.5,
    openTime: "2024-03-09 14:30",
    closeTime: "2024-03-10 12:45",
  },
  {
    id: 5,
    symbol: "EURUSD",
    type: "SELL",
    openPrice: 1.0902,
    closePrice: 1.0845,
    size: 2.0,
    profit: 114.0,
    openTime: "2024-03-08 10:05",
    closeTime: "2024-03-08 17:20",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 bg-white dark:bg-[#040a14] min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="mb-8">
          <Title title="Dashboard" />
          <Description description="Welcome back! Here's an overview of your trading account." />
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
            className="gap-1 bg-teal-500 dark:bg-[#12e9ee] text-white 
                     dark:text-[#040a14] hover:bg-teal-600 
                     dark:hover:bg-[#12e9ee]/90
                     transition-all duration-300 dark:glow-teal"
          >
            <Target className="h-4 w-4" />
            New Challenge
          </Button>
        </div>
      </div>

      {/* Account Status Card */}
      <Card
        className="dark:dark-card border-l-4 border-l-[#12e9ee] 
                    bg-white dark:bg-gradient-to-br dark:from-[#062f3a] 
                    dark:to-[#083c5a] shadow-lg dark:shadow-[#12e9ee]/5"
      >
        <CardContent className="p-6">
          <div
            className="flex flex-col space-y-2 md:flex-row md:items-center 
                       md:justify-between md:space-y-0"
          >
            <div>
              <h3
                className="text-xl  font-semibold 
                          text-gray-900 dark:text-[#f6f9fa]"
              >
                Express Account #73549
              </h3>
              <p className="text-sm text-gray-600 dark:text-[#f6f9fa]/70 ">
                Phase 1 Evaluation - 6 days remaining
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge status="active">Active</Badge>
              <Badge status="warning">Trading Objectives: 1/3</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      hover:shadow-lg transition-all duration-300
                      dark:shadow-[#12e9ee]/5"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium 
                               text-gray-900 dark:text-[#f6f9fa]"
            >
              Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-[#12e9ee]" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl  font-bold 
                         text-gray-900 dark:text-[#f6f9fa]"
            >
              $11,320.00
            </div>
            <p className="text-xs text-gray-600 dark:text-[#f6f9fa]/70">
              <span className="text-green-500 dark:text-[#12e9ee] flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                13.2%
              </span>{" "}
              from initial
            </p>
          </CardContent>
        </Card>
        <Card
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      hover:shadow-lg transition-all duration-300
                      dark:shadow-[#12e9ee]/5"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm  font-medium 
                               text-gray-900 dark:text-[#f6f9fa]"
            >
              Profit
            </CardTitle>
            <BadgePercent className="h-4 w-4 text-gray-500 dark:text-[#12e9ee]" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl  font-bold 
                         text-gray-900 dark:text-[#f6f9fa]"
            >
              $1,320.00
            </div>
            <p className="text-xs  text-gray-600 dark:text-[#f6f9fa]/70">
              <span className="text-green-500 dark:text-[#12e9ee] flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                +4.5%
              </span>{" "}
              this month
            </p>
          </CardContent>
        </Card>
        <Card
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      hover:shadow-lg transition-all duration-300
                      dark:shadow-[#12e9ee]/5"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm  font-medium 
                               text-gray-900 dark:text-[#f6f9fa]"
            >
              Trades
            </CardTitle>
            <LineChart className="h-4 w-4 text-gray-500 dark:text-[#12e9ee]" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl  font-bold 
                         text-gray-900 dark:text-[#f6f9fa]"
            >
              28
            </div>
            <p className="text-xs text-gray-600 dark:text-[#f6f9fa]/70">
              <span className="text-primary dark:text-[#12e9ee] flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                12 new
              </span>{" "}
              this week
            </p>
          </CardContent>
        </Card>
        <Card
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      hover:shadow-lg transition-all duration-300
                      dark:shadow-[#12e9ee]/5"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium 
                               text-gray-900 dark:text-[#f6f9fa]"
            >
              Win Rate
            </CardTitle>
            <Target className="h-4 w-4 text-gray-500 dark:text-[#12e9ee]" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl  font-bold 
                         text-gray-900 dark:text-[#f6f9fa]"
            >
              68%
            </div>
            <p className="text-xs  text-gray-600 dark:text-[#f6f9fa]/70">
              <span className="text-green-500 dark:text-[#12e9ee] flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                +2.3%
              </span>{" "}
              from previous
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Overview Tab and Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card
          className="md:col-span-4 dark:dark-card bg-white 
                      dark:bg-gradient-to-br dark:from-[#062f3a] 
                      dark:to-[#083c5a]"
        >
          <CardHeader>
            <CardTitle
              className="text-gray-900 
                               dark:text-[#f6f9fa]"
            >
              Balance Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                    stroke="#f6f9fa"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#f6f9fa"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="#f6f9fa" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#040a14",
                      border: "1px solid #12e9ee20",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#12e9ee"
                    fill="#12e9ee"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#486ebb"
                    fill="#486ebb"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trading Objectives Card */}
        <Card className="md:col-span-3 dark:dark-card bg-white dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a] hover:shadow-lg transition-all duration-300 dark:shadow-[#12e9ee]/5">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-[#f6f9fa]">
              Trading Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm   ">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-[#12e9ee] dark:bg-[#12e9ee]" />
                  <span className="text-gray-900 dark:text-[#f6f9fa]">
                    Profit Target (8%)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#f6f9fa]">
                  4.5% / 8%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-[#040a14]/50">
                <div className="h-full w-[56%] rounded-full bg-[#12e9ee] dark:bg-[#12e9ee] animate-glow" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm   ">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-[#486ebb] dark:bg-[#486ebb]" />
                  <span className="text-gray-900 dark:text-[#f6f9fa]">
                    Max Daily Loss (4%)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#f6f9fa]">
                  1.2% / 4%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-[#040a14]/50">
                <div className="h-full w-[30%] rounded-full bg-[#486ebb] animate-glow dark:bg-[#486ebb]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm   ">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-[#875f85] dark:bg-[#875f85]" />
                  <span className="text-gray-900 dark:text-[#f6f9fa]">
                    Max Total Loss (10%)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#f6f9fa]">
                  6% / 10%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-[#040a14]/50">
                <div className="h-full w-[6%] rounded-full animate-glow bg-[#875f85] dark:bg-[#875f85]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm   ">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-[#12e9ee] dark:bg-[#12e9ee]" />
                  <span className="text-gray-900 dark:text-[#f6f9fa]">
                    Min Trading Days (10)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#f6f9fa]">
                  6 / 10
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-[#040a14]/50">
                <div className="h-full w-[60%] animate-glow rounded-full bg-[#12e9ee] dark:bg-[#12e9ee]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats and History */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Trading Direction Card */}
        <Card className="md:col-span-3 dark:dark-card bg-white dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a] hover:shadow-lg transition-all duration-300 dark:shadow-[#12e9ee]/5">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-[#f6f9fa]">
              Trading Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tradingData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                    stroke="#f6f9fa"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#f6f9fa"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="#f6f9fa" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#040a14",
                      border: "1px solid #12e9ee20",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="long" stackId="a" fill="#12e9ee" name="Long" />
                  <Bar
                    dataKey="short"
                    stackId="a"
                    fill="#486ebb"
                    name="Short"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latest Trades Card */}
        <Card className="md:col-span-4 dark:dark-card bg-white dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a] hover:shadow-lg transition-all duration-300 dark:shadow-[#12e9ee]/5">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-[#f6f9fa]">
              Latest Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-[#12e9ee]/10">
                    <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                      Symbol
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                      Type
                    </TableHead>
                    <TableHead className=" text-gray-900 dark:text-[#f6f9fa] text-right">
                      Size
                    </TableHead>
                    <TableHead className=" text-gray-900 dark:text-[#f6f9fa] text-right">
                      Profit/Loss
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradingHistory.map((trade) => (
                    <TableRow
                      key={trade.id}
                      className="border-b border-gray-200 dark:border-[#12e9ee]/10"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-[#f6f9fa]">
                        {trade.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge type={trade.type === "BUY" ? "buy" : "sell"}>
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="   text-right text-gray-900 dark:text-[#f6f9fa]">
                        {trade.size}
                      </TableCell>
                      <TableCell
                        className={`   text-right ${
                          trade.profit >= 0
                            ? "text-green-500 dark:text-[#12e9ee]"
                            : "text-red-500 dark:text-[#875f85]"
                        }`}
                      >
                        ${trade.profit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Updated Badge component
function Badge({
  children,
  status,
  type,
}: {
  children: React.ReactNode;
  status?: string;
  type?: string;
}) {
  let className = `
    inline-flex items-center rounded-full px-2.5 py-1 
    text-xs font-medium 
    transition-all duration-300
  `;

  if (status === "active") {
    className +=
      " bg-green-100 text-green-800 dark:bg-[#12e9ee]/10 dark:text-[#12e9ee]";
  } else if (status === "warning") {
    className +=
      " bg-yellow-100 text-yellow-800 dark:bg-[#486ebb]/10 dark:text-[#486ebb]";
  } else if (type === "BUY" || type === "buy") {
    className +=
      " bg-green-100 text-green-800 dark:bg-[#12e9ee]/10 dark:text-[#12e9ee]";
  } else if (type === "SELL" || type === "sell") {
    className +=
      " bg-red-100 text-red-800 dark:bg-[#875f85]/10 dark:text-[#875f85]";
  }

  return <span className={className}>{children}</span>;
}
