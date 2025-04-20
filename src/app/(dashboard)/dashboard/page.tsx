"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgePercent, DollarSign, UserIcon, LineChart, Target, Calendar, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, TooltipProps } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  { id: 1, symbol: "EURUSD", type: "BUY", openPrice: 1.0821, closePrice: 1.0875, size: 1.25, profit: 54.00, openTime: "2024-03-12 09:32", closeTime: "2024-03-12 14:45" },
  { id: 2, symbol: "GBPUSD", type: "SELL", openPrice: 1.2654, closePrice: 1.2589, size: 0.75, profit: 48.75, openTime: "2024-03-11 15:20", closeTime: "2024-03-12 10:15" },
  { id: 3, symbol: "USDJPY", type: "BUY", openPrice: 149.85, closePrice: 150.75, size: 1.00, profit: 90.00, openTime: "2024-03-10 22:15", closeTime: "2024-03-11 05:30" },
  { id: 4, symbol: "XAUUSD", type: "SELL", openPrice: 2018.50, closePrice: 2025.75, size: 0.10, profit: -72.50, openTime: "2024-03-09 14:30", closeTime: "2024-03-10 12:45" },
  { id: 5, symbol: "EURUSD", type: "SELL", openPrice: 1.0902, closePrice: 1.0845, size: 2.00, profit: 114.00, openTime: "2024-03-08 10:05", closeTime: "2024-03-08 17:20" },
];

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  // If not client yet, show nothing to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your trading account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="gap-1">
            <Target className="h-4 w-4" />
            New Challenge
          </Button>
        </div>
      </div>

      {/* Account Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h3 className="text-xl font-semibold">Express Account #73549</h3>
              <p className="text-sm text-muted-foreground">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$11,320.00</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                13.2%
              </span>{" "}
              from initial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,320.00</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                +4.5%
              </span>{" "}
              this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trades</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary flex items-center">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                12 new
              </span>{" "}
              this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
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
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Balance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="equity" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="balance" stackId="2" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Trading Objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                  <span>Profit Target (8%)</span>
                </div>
                <span className="font-medium">4.5% / 8%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[56%] rounded-full bg-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-amber-500" />
                  <span>Max Daily Loss (4%)</span>
                </div>
                <span className="font-medium">1.2% / 4%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[30%] rounded-full bg-amber-500" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-destructive" />
                  <span>Max Total Loss (10%)</span>
                </div>
                <span className="font-medium">0% / 10%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[0%] rounded-full bg-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                  <span>Min Trading Days (10)</span>
                </div>
                <span className="font-medium">6 / 10</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[60%] rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Stats and History */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Trading Direction</CardTitle>
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
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="long" stackId="a" fill="hsl(var(--chart-1))" name="Long" />
                  <Bar dataKey="short" stackId="a" fill="hsl(var(--chart-3))" name="Short" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Latest Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradingHistory.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge type={trade.type === "BUY" ? "buy" : "sell"}>
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{trade.size}</TableCell>
                      <TableCell className={`text-right ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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

// Badge component
function Badge({ children, status, type }: { children: React.ReactNode; status?: string; type?: string }) {
  let className = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

  if (status === "active") {
    className += " bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400";
  } else if (status === "warning") {
    className += " bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400";
  } else if (status === "danger") {
    className += " bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400";
  } else if (type === "BUY" || type === "buy") {
    className += " bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400";
  } else if (type === "SELL" || type === "sell") {
    className += " bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400";
  } else {
    className += " bg-primary/10 text-primary";
  }

  return <span className={className}>{children}</span>;
}
