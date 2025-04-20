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
    <Card
      className="dark:dark-card bg-white dark:bg-gradient-to-br 
                   dark:from-[#062f3a] dark:to-[#083c5a] 
                   shadow-lg dark:shadow-[#12e9ee]/5 
                   border border-gray-200 dark:border-[#12e9ee]/10 
                   transition-all duration-300"
    >
      <CardHeader className="border-b border-gray-100 dark:border-[#12e9ee]/10">
        <CardTitle
          className="font-clash-display text-xl text-gray-900 
                           dark:text-[#f6f9fa]"
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow
              className="border-b border-gray-100 dark:border-[#12e9ee]/10
                              hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5"
            >
              <TableHead
                className="font-clash-grotesk text-gray-700 
                                dark:text-[#f6f9fa]/70"
              >
                Account Number
              </TableHead>
              <TableHead
                className="font-clash-grotesk text-gray-700 
                                dark:text-[#f6f9fa]/70"
              >
                Account Size
              </TableHead>
              <TableHead
                className="font-clash-grotesk text-gray-700 
                                dark:text-[#f6f9fa]/70"
              >
                Account Balance
              </TableHead>
              <TableHead
                className="font-clash-grotesk text-gray-700 
                                dark:text-[#f6f9fa]/70"
              >
                Certificate Date
              </TableHead>
              <TableHead
                className="font-clash-grotesk text-gray-700 
                                dark:text-[#f6f9fa]/70"
              >
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((cert, index) => (
              <TableRow
                key={index}
                className="border-b border-gray-100 dark:border-[#12e9ee]/10
                         hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 
                         transition-colors duration-200"
              >
                <TableCell
                  className="font-clash-grotesk text-gray-900 
                                  dark:text-[#f6f9fa] font-medium"
                >
                  {cert.accountNumber}
                </TableCell>
                <TableCell
                  className="font-clash-grotesk text-gray-700 
                                  dark:text-[#f6f9fa]/90"
                >
                  {cert.accountSize}
                </TableCell>
                <TableCell
                  className="font-clash-grotesk text-gray-700 
                                  dark:text-[#f6f9fa]/90"
                >
                  {cert.accountBalance}
                </TableCell>
                <TableCell
                  className="font-clash-grotesk text-gray-700 
                                  dark:text-[#f6f9fa]/90"
                >
                  {cert.date}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[#12e9ee]/10 text-gray-700 
                             dark:text-[#12e9ee] hover:text-[#12e9ee] 
                             font-clash-grotesk transition-all duration-300 
                             group"
                  >
                    <Download
                      className="h-4 w-4 mr-2 group-hover:scale-110 
                                     transition-transform duration-300"
                    />
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
    <div className="min-h-screen bg-white dark:bg-[#040a14] p-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-3xl font-clash-display font-bold 
                      text-gray-900 dark:text-[#f6f9fa] mb-2"
          >
            My Certificates
          </h1>
          <p
            className="text-gray-600 dark:text-[#f6f9fa]/70 
                     font-clash-grotesk"
          >
            View and download your achievement certificates
          </p>
        </div>

        <div className="space-y-8">
          <CertificateTable
            title="Evaluation Certificates"
            certificates={evaluationCertificates}
          />

          <CertificateTable
            title="Payout Certificates"
            certificates={payoutCertificates}
          />
        </div>
      </div>
    </div>
  );
};

export default CertificatesPage;
