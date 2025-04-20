"use client";
import React, { useState } from "react";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";

interface Contract {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
}

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([
    // Remove this sample data in production
    {
      id: "1",
      name: "Trading_Agreement_2024.pdf",
      uploadedAt: "2024-03-20",
      size: "1.2 MB",
    },
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Here you would typically upload the file to your backend
      // This is just a mock implementation
      const newContract: Contract = {
        id: Date.now().toString(),
        name: file.name,
        uploadedAt: new Date().toISOString().split("T")[0],
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };
      setContracts([...contracts, newContract]);
    }
  };

  const handleDownload = (contractId: string) => {
    // Implement actual download logic here
    console.log(`Downloading contract ${contractId}`);
  };

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contracts</h1>
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Contract</span>
          </label>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-card dark:bg-card rounded-xl p-8 border text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground">
              No Contracts Available
            </h3>
            <p className="text-muted-foreground">
              Upload your first contract to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card dark:bg-card rounded-xl border">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-4 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary-purple" />
                <div>
                  <h3 className="font-medium text-foreground">
                    {contract.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {contract.uploadedAt} • {contract.size}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(contract.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
