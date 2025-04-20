import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Certificate {
  accountNumber: string;
  accountSize: string;
  accountBalance: string;
  date: string;
  downloadUrl: string;
}

const CertificatesPage = () => {
  // Mock data - replace with actual data from your API
  const evaluationCertificates: Certificate[] = [
    {
      accountNumber: "EVL-123456",
      accountSize: "$100,000",
      accountBalance: "$105,000",
      date: "2024-03-20",
      downloadUrl: "#",
    },
    // Add more certificates as needed
  ];

  const payoutCertificates: Certificate[] = [
    {
      accountNumber: "PO-123456",
      accountSize: "$100,000",
      accountBalance: "$108,000",
      date: "2024-03-15",
      downloadUrl: "#",
    },
    // Add more certificates as needed
  ];

  const CertificateTable = ({
    certificates,
    title,
  }: {
    certificates: Certificate[];
    title: string;
  }) => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>Account Size</TableHead>
              <TableHead>Account Balance</TableHead>
              <TableHead>Certificate Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((cert, index) => (
              <TableRow key={index}>
                <TableCell>{cert.accountNumber}</TableCell>
                <TableCell>{cert.accountSize}</TableCell>
                <TableCell>{cert.accountBalance}</TableCell>
                <TableCell>{cert.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto ">
      <h1 className="text-3xl font-bold mb-8">My Certificates</h1>
      <CertificateTable
        title="Evaluation Certificates"
        certificates={evaluationCertificates}
      />

      <CertificateTable
        title="Payout Certificates"
        certificates={payoutCertificates}
      />
    </div>
  );
};

export default CertificatesPage;
