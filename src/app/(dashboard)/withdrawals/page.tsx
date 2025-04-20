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
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Download,
  FileText,
  CreditCard,
  WalletIcon,
  LandmarkIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon
} from "lucide-react";

// Sample withdrawal history data
const withdrawals = [
  {
    id: "W2345",
    amount: 2400,
    status: "Completed",
    date: "2024-03-15",
    method: "Bank Transfer",
    account: "Express Account #59721"
  },
  {
    id: "W2302",
    amount: 980,
    status: "Processing",
    date: "2024-03-02",
    method: "PayPal",
    account: "Express Account #59721"
  },
  {
    id: "W2289",
    amount: 560,
    status: "Completed",
    date: "2024-02-18",
    method: "Bank Transfer",
    account: "Express Account #59721"
  },
  {
    id: "W2265",
    amount: 1120,
    status: "Rejected",
    date: "2024-02-05",
    method: "Crypto",
    account: "Express Account #73549",
    reason: "Invalid wallet address provided"
  },
  {
    id: "W2201",
    amount: 730,
    status: "Completed",
    date: "2024-01-22",
    method: "Bank Transfer",
    account: "Express Account #59721"
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
    fundingDetails: null
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
      lastPayout: "2024-03-15"
    }
  },
];

// Payment method options
const paymentMethods = [
  { id: "bank", name: "Bank Transfer", icon: <LandmarkIcon className="h-4 w-4" /> },
  { id: "paypal", name: "PayPal", icon: <WalletIcon className="h-4 w-4" /> },
  { id: "crypto", name: "Cryptocurrency", icon: <FileText className="h-4 w-4" /> },
];

export default function WithdrawalsPage() {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  // Find the account that is funded
  const fundedAccount = accounts.find(account => account.status === "Funded");

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

    const account = accounts.find(acc => acc.id === selectedAccount);

    if (!account?.fundingDetails) {
      setWithdrawalError("Selected account is not eligible for withdrawals");
      return;
    }

    if (amount > account.fundingDetails.availableForWithdrawal) {
      setWithdrawalError(`Amount exceeds available balance (${account.fundingDetails.availableForWithdrawal})`);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Withdrawals</h2>
          <p className="text-muted-foreground">
            Manage your earnings and track withdrawal history
          </p>
        </div>
        <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!fundedAccount}>
              <ArrowUpIcon className="h-4 w-4" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Complete the form below to request a funds withdrawal from your funded account.
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
                <Label htmlFor="account" className="text-right">
                  Account
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(account => account.status === "Funded")
                        .map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    placeholder="0.00"
                    className="pl-8"
                    type="number"
                    min="0"
                    step="0.01"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="method" className="text-right">
                  Method
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <SelectTrigger id="method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
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
              <Button variant="outline" onClick={() => setIsWithdrawalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleWithdrawalRequest}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fundedAccount?.fundingDetails ? `$${fundedAccount.fundingDetails.availableForWithdrawal.toLocaleString()}` : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fundedAccount?.fundingDetails ? `Next payout date: ${fundedAccount.fundingDetails.nextPayoutDate}` : "No funded accounts available"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${withdrawals
                .filter(w => w.status === "Completed")
                .reduce((sum, w) => sum + w.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fundedAccount?.fundingDetails ? fundedAccount.fundingDetails.profitSplit : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fundedAccount ? `For ${fundedAccount.name}` : "No funded accounts available"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawals History</CardTitle>
          <CardDescription>
            View and manage your withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length > 0 ? (
                withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.id}</TableCell>
                    <TableCell>{withdrawal.account}</TableCell>
                    <TableCell>{new Date(withdrawal.date).toLocaleDateString()}</TableCell>
                    <TableCell>{withdrawal.method}</TableCell>
                    <TableCell className="text-right">${withdrawal.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={withdrawal.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <p className="text-muted-foreground">No withdrawal history found</p>
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

// Withdrawal Status Badge component
function WithdrawalStatusBadge({ status }: { status: string }) {
  let className = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  let icon = null;

  switch (status) {
    case "Completed":
      className += " bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400";
      icon = <CheckCircleIcon className="mr-1 h-3 w-3" />;
      break;
    case "Processing":
      className += " bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400";
      icon = <ClockIcon className="mr-1 h-3 w-3" />;
      break;
    case "Rejected":
      className += " bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400";
      icon = <XCircleIcon className="mr-1 h-3 w-3" />;
      break;
    default:
      className += " bg-muted text-muted-foreground";
  }

  return (
    <span className={className}>
      {icon}
      <span>{status}</span>
    </span>
  );
}
