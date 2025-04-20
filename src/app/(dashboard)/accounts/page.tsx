"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  FilterIcon,
  PlusCircleIcon,
  SearchIcon,
  MoreHorizontalIcon,
  CopyIcon,
  EyeIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PauseCircleIcon
} from "lucide-react";

// Sample accounts data
const accounts = [
  {
    id: "73549",
    name: "Express Account #73549",
    program: "Express Challenge",
    balance: 10000,
    equity: 11320,
    profit: 1320,
    profitPercent: 13.2,
    phase: "Phase 1 Evaluation",
    daysLeft: 6,
    status: "Active",
    progress: 1,
    totalObjectives: 3
  },
  {
    id: "68542",
    name: "Advanced Account #68542",
    program: "Advanced Challenge",
    balance: 50000,
    equity: 48750,
    profit: -1250,
    profitPercent: -2.5,
    phase: "Phase 2 Verification",
    daysLeft: 18,
    status: "Warning",
    progress: 2,
    totalObjectives: 3
  },
  {
    id: "59721",
    name: "Express Account #59721",
    program: "Express Challenge",
    balance: 25000,
    equity: 28450,
    profit: 3450,
    profitPercent: 13.8,
    phase: "Funded",
    daysLeft: null,
    status: "Funded",
    progress: 3,
    totalObjectives: 3
  },
  {
    id: "44381",
    name: "Standard Account #44381",
    program: "Standard Challenge",
    balance: 100000,
    equity: 94500,
    profit: -5500,
    profitPercent: -5.5,
    phase: "Phase 1 Evaluation",
    daysLeft: 0,
    status: "Failed",
    progress: 0,
    totalObjectives: 3
  },
];

export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState(accounts);
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter accounts based on search query and active filter
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    filterAccounts(query, activeFilter);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    filterAccounts(searchQuery, filter);
  };

  const filterAccounts = (query: string, filter: string) => {
    let results = accounts.filter(account =>
      account.name.toLowerCase().includes(query) ||
      account.program.toLowerCase().includes(query) ||
      account.id.includes(query)
    );

    if (filter !== "All") {
      results = results.filter(account => account.status === filter);
    }

    setFilteredAccounts(results);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Accounts</h2>
          <p className="text-muted-foreground">
            Manage and monitor all your trading accounts
          </p>
        </div>
        <Button className="gap-2">
          <PlusCircleIcon className="h-4 w-4" />
          New Challenge
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search accounts..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => handleFilterChange("All")}
                data-active={activeFilter === "All"}
              >
                All <span className="ml-1 text-xs rounded-full bg-muted px-2 py-0.5">{accounts.length}</span>
              </Button>
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => handleFilterChange("Active")}
                data-active={activeFilter === "Active"}
              >
                Active
              </Button>
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => handleFilterChange("Funded")}
                data-active={activeFilter === "Funded"}
              >
                Funded
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleFilterChange("All")}>
                    All Accounts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("Active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("Warning")}>
                    Warning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("Funded")}>
                    Funded
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("Failed")}>
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="hidden md:table-cell">Phase</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div>
                        {account.name}
                        {account.status === "Active" && account.daysLeft !== null && (
                          <p className="text-xs text-muted-foreground">
                            {account.daysLeft} days remaining
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{account.program}</TableCell>
                    <TableCell className="hidden md:table-cell">{account.phase}</TableCell>
                    <TableCell className="text-right">${account.equity.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${account.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${account.profit.toLocaleString()} ({account.profitPercent}%)
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AccountStatusBadge status={account.status} progress={account.progress} total={account.totalObjectives} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <EyeIcon className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <CopyIcon className="mr-2 h-4 w-4" />
                            <span>Copy Account ID</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <RefreshCwIcon className="mr-2 h-4 w-4" />
                            <span>Refresh Data</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <ExternalLinkIcon className="mr-2 h-4 w-4" />
                            <span>Open in MT5</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-muted-foreground">No accounts found</p>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("All");
                        setFilteredAccounts(accounts);
                      }}>
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Account Status Badge component
function AccountStatusBadge({ status, progress, total }: { status: string; progress: number; total: number }) {
  let className = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  let icon = null;

  switch (status) {
    case "Active":
      className += " bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400";
      icon = <CheckCircleIcon className="mr-1 h-3 w-3" />;
      break;
    case "Warning":
      className += " bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400";
      icon = <AlertCircleIcon className="mr-1 h-3 w-3" />;
      break;
    case "Funded":
      className += " bg-primary/20 text-primary";
      icon = <CheckCircleIcon className="mr-1 h-3 w-3" />;
      break;
    case "Failed":
      className += " bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400";
      icon = <PauseCircleIcon className="mr-1 h-3 w-3" />;
      break;
    default:
      className += " bg-muted text-muted-foreground";
  }

  return (
    <span className={className}>
      {icon}
      <span>
        {status}
        {status !== "Failed" && status !== "Funded" && (
          <span className="ml-1">({progress}/{total})</span>
        )}
      </span>
    </span>
  );
}
