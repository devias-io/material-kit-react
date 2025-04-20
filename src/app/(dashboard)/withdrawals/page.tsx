"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import {
  DollarSign,
  FileText,
  WalletIcon,
  LandmarkIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  Calendar,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

// Sample withdrawal history data
const withdrawals = [
  {
    id: "W2345",
    amount: 2400,
    status: "Completed",
    date: "2024-03-15",
    method: "Bank Transfer",
    account: "Express Account #59721",
  },
  {
    id: "W2302",
    amount: 980,
    status: "Processing",
    date: "2024-03-02",
    method: "PayPal",
    account: "Express Account #59721",
  },
  {
    id: "W2289",
    amount: 560,
    status: "Completed",
    date: "2024-02-18",
    method: "Bank Transfer",
    account: "Express Account #59721",
  },
  {
    id: "W2265",
    amount: 1120,
    status: "Rejected",
    date: "2024-02-05",
    method: "Crypto",
    account: "Express Account #73549",
    reason: "Invalid wallet address provided",
  },
  {
    id: "W2201",
    amount: 730,
    status: "Completed",
    date: "2024-01-22",
    method: "Bank Transfer",
    account: "Express Account #59721",
  },
];

// Sample accounts data
const accounts = [
  {
    id: "73549",
    name: "Express Account #73549",
    balance: 11320,
    phase: "Phase 1 Evaluation",
    status: "Active",
    fundingDetails: null,
  },
  {
    id: "59721",
    name: "Express Account #59721",
    balance: 28450,
    phase: "Funded",
    status: "Funded",
    fundingDetails: {
      availableForWithdrawal: 1750,
      nextPayoutDate: "2024-04-04",
      profitSplit: "80/20",
      lastPayout: "2024-03-15",
    },
  },
];

// Payment method options
const paymentMethods = [
  {
    id: "bank",
    name: "Bank Transfer",
    icon: <LandmarkIcon className="h-4 w-4" />,
  },
  { id: "paypal", name: "PayPal", icon: <WalletIcon className="h-4 w-4" /> },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: <FileText className="h-4 w-4" />,
  },
];

export default function WithdrawalsPage() {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  // Find the account that is funded
  const fundedAccount = accounts.find((account) => account.status === "Funded");

  const handleWithdrawalRequest = () => {
    // Validate inputs
    if (!selectedAccount) {
      setWithdrawalError("Please select an account");
      return;
    }

    if (!selectedPaymentMethod) {
      setWithdrawalError("Please select a payment method");
      return;
    }

    const amount = Number.parseFloat(withdrawalAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setWithdrawalError("Please enter a valid amount");
      return;
    }

    const account = accounts.find((acc) => acc.id === selectedAccount);

    if (!account?.fundingDetails) {
      setWithdrawalError("Selected account is not eligible for withdrawals");
      return;
    }

    if (amount > account.fundingDetails.availableForWithdrawal) {
      setWithdrawalError(
        `Amount exceeds available balance (${account.fundingDetails.availableForWithdrawal})`
      );
      return;
    }

    // Handle withdrawal (would be an API call in a real app)
    setWithdrawalError(null);
    setIsWithdrawalDialogOpen(false);

    // Reset form
    setSelectedAccount("");
    setSelectedPaymentMethod("");
    setWithdrawalAmount("");

    // In a real app, we'd show a success message and update the withdrawals list
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-clash-display font-bold tracking-tight text-gray-900 dark:text-[#f6f9fa]">
              Withdrawals
            </h1>
            <p className="text-gray-600 dark:text-[#f6f9fa]/70 font-clash-grotesk">
              Manage your withdrawal requests and view withdrawal history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-gray-200 dark:border-[#12e9ee]/20 
                       hover:bg-gray-100 dark:hover:bg-[#12e9ee]/10 
                       text-gray-700 dark:text-[#f6f9fa] font-clash-grotesk
                       transition-all duration-300"
            >
              <Calendar className="h-4 w-4" />
              Last 30 Days
            </Button>
            <Dialog
              open={isWithdrawalDialogOpen}
              onOpenChange={setIsWithdrawalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="gap-2 bg-teal-500 dark:bg-[#12e9ee] 
                          text-white dark:text-[#040a14] 
                          hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                          font-clash-grotesk transition-all duration-300 
                          dark:glow-teal group"
                  disabled={!fundedAccount}
                >
                  <ArrowUpIcon
                    className="h-4 w-4 group-hover:scale-110 
                             transition-transform duration-300"
                  />
                  Request Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent
                className="dark:dark-card bg-white 
                         dark:bg-gradient-to-br 
                         dark:from-[#062f3a] dark:to-[#083c5a] 
                         border border-gray-200 
                         dark:border-[#12e9ee]/10"
              >
                <DialogHeader>
                  <DialogTitle
                    className="font-clash-display text-xl 
                             text-gray-900 dark:text-[#f6f9fa]"
                  >
                    Request Withdrawal
                  </DialogTitle>
                  <DialogDescription
                    className="font-clash-grotesk 
                             text-gray-600 dark:text-[#f6f9fa]/70"
                  >
                    Complete the form below to request a funds withdrawal from
                    your funded account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {withdrawalError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                      <AlertCircleIcon className="h-4 w-4" />
                      {withdrawalError}
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="account"
                      className="text-right text-gray-900 dark:text-[#f6f9fa]"
                    >
                      Account
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger
                          id="account"
                          className="border-gray-200 dark:border-[#12e9ee]/20"
                        >
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((account) => account.status === "Funded")
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="amount"
                      className="text-right text-gray-900 dark:text-[#f6f9fa]"
                    >
                      Amount
                    </Label>
                    <div className="col-span-3 relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-[#12e9ee]" />
                      <Input
                        id="amount"
                        placeholder="0.00"
                        className="pl-8 border-gray-200 dark:border-[#12e9ee]/20"
                        type="number"
                        min="0"
                        step="0.01"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="method"
                      className="text-right text-gray-900 dark:text-[#f6f9fa]"
                    >
                      Method
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        <SelectTrigger
                          id="method"
                          className="border-gray-200 dark:border-[#12e9ee]/20"
                        >
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-2">
                                {method.icon}
                                <span>{method.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsWithdrawalDialogOpen(false)}
                    className="border-gray-200 dark:border-[#12e9ee]/20 
                             hover:bg-gray-100 dark:hover:bg-[#12e9ee]/10 
                             text-gray-700 dark:text-[#f6f9fa]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdrawalRequest}
                    className="bg-teal-500 dark:bg-[#12e9ee] 
                             text-white dark:text-[#040a14] 
                             hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                             dark:glow-teal"
                  >
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      border border-gray-200 dark:border-[#12e9ee]/10 
                      shadow-lg dark:shadow-[#12e9ee]/5"
          >
            <CardHeader className="pb-2">
              <CardTitle
                className="text-sm font-clash-grotesk font-medium 
                          text-gray-900 dark:text-[#f6f9fa]"
              >
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-clash-display font-bold 
                          text-gray-900 dark:text-[#12e9ee]"
              >
                {fundedAccount?.balance
                  ? `$${fundedAccount.balance.toFixed(2)}`
                  : "N/A"}
              </div>
              <p
                className="text-xs font-clash-grotesk 
                         text-gray-600 dark:text-[#f6f9fa]/70 mt-1"
              >
                {fundedAccount
                  ? `For ${fundedAccount.name}`
                  : "No funded accounts available"}
              </p>
            </CardContent>
          </Card>

          <Card
            className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      border border-gray-200 dark:border-[#12e9ee]/10 
                      shadow-lg dark:shadow-[#12e9ee]/5"
          >
            <CardHeader className="pb-2">
              <CardTitle
                className="text-sm font-clash-grotesk font-medium 
                          text-gray-900 dark:text-[#f6f9fa]"
              >
                Profit Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-clash-display font-bold 
                          text-gray-900 dark:text-[#12e9ee]"
              >
                {fundedAccount?.fundingDetails
                  ? fundedAccount.fundingDetails.profitSplit
                  : "N/A"}
              </div>
              <p
                className="text-xs font-clash-grotesk 
                         text-gray-600 dark:text-[#f6f9fa]/70 mt-1"
              >
                {fundedAccount
                  ? `For ${fundedAccount.name}`
                  : "No funded accounts available"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                    dark:from-[#062f3a] dark:to-[#083c5a] 
                    border border-gray-200 dark:border-[#12e9ee]/10 
                    shadow-lg dark:shadow-[#12e9ee]/5"
        >
          <CardHeader>
            <CardTitle
              className="font-clash-display text-xl 
                        text-gray-900 dark:text-[#f6f9fa]"
            >
              Withdrawals History
            </CardTitle>
            <CardDescription
              className="font-clash-grotesk 
                       text-gray-600 dark:text-[#f6f9fa]/70"
            >
              View and manage your withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-[#12e9ee]/20">
                  <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                    Date
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                    Account
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                    Amount
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                    Method
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-[#f6f9fa]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow
                    key={withdrawal.id}
                    className="border-gray-200 dark:border-[#12e9ee]/20 
                             hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 
                             transition-colors"
                  >
                    <TableCell className="font-clash-grotesk text-gray-900 dark:text-[#f6f9fa]">
                      {new Date(withdrawal.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-clash-grotesk text-gray-900 dark:text-[#f6f9fa]">
                      {withdrawal.account}
                    </TableCell>
                    <TableCell className="font-clash-grotesk text-gray-900 dark:text-[#f6f9fa]">
                      ${withdrawal.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-clash-grotesk text-gray-900 dark:text-[#f6f9fa]">
                      {withdrawal.method}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          withdrawal.status === "Completed"
                            ? "default"
                            : withdrawal.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="font-clash-grotesk"
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Updated WithdrawalStatusBadge component
function WithdrawalStatusBadge({ status }: { status: string }) {
  let className = `
    inline-flex items-center rounded-full px-2.5 py-1 
    text-xs font-clash-grotesk font-medium 
    transition-all duration-300
  `;

  switch (status) {
    case "Completed":
      className +=
        " bg-green-100 text-green-800 dark:bg-[#12e9ee]/10 dark:text-[#12e9ee]";
      break;
    case "Processing":
      className +=
        " bg-blue-100 text-blue-800 dark:bg-[#486ebb]/10 dark:text-[#486ebb]";
      break;
    case "Rejected":
      className +=
        " bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400";
      break;
    default:
      className +=
        " bg-gray-100 dark:bg-gray-500/10 text-gray-800 dark:text-gray-400";
  }

  return (
    <span className={className}>
      {getStatusIcon(status)}
      <span>{status}</span>
    </span>
  );
}

// Helper function for status icons
function getStatusIcon(status: string) {
  const iconClass = "mr-1 h-3 w-3";
  switch (status) {
    case "Completed":
      return <CheckCircleIcon className={iconClass} />;
    case "Processing":
      return <ClockIcon className={iconClass} />;
    case "Rejected":
      return <XCircleIcon className={iconClass} />;
    default:
      return null;
  }
}
