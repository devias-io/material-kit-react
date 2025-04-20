"use client";
import React, { useState } from "react";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import Title from "@/components/layout/title";
import Description from "@/components/layout/description";

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
    <div className="min-h-screen bg-white dark:bg-[#040a14]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="mb-8">
            <Title title="Contracts" />
            <Description description="Manage and view your trading agreements" />
          </div>
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
              className="flex items-center gap-2 px-4 py-2 
                     bg-teal-500 dark:bg-[#12e9ee] 
                     text-white dark:text-[#040a14] 
                     rounded-lg hover:bg-teal-600 
                     dark:hover:bg-[#12e9ee]/90 
                     transition-all duration-300 
                     cursor-pointer   
                     dark:glow-teal group"
            >
              <Upload
                className="w-5 h-5 group-hover:scale-110 
                             transition-transform duration-300"
              />
              <span>Upload Contract</span>
            </label>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div
            className="dark:dark-card bg-white dark:bg-gradient-to-br 
                       dark:from-[#062f3a] dark:to-[#083c5a] 
                       rounded-xl p-8 border border-gray-200 
                       dark:border-[#12e9ee]/10 text-center 
                       shadow-lg dark:shadow-[#12e9ee]/5"
          >
            <div className="flex flex-col items-center gap-4">
              <AlertCircle
                className="w-12 h-12 text-gray-400 
                                  dark:text-[#12e9ee]/50"
              />
              <h3
                className="text-xl   font-semibold 
                         text-gray-900 dark:text-[#f6f9fa]"
              >
                No Contracts Available
              </h3>
              <p
                className="text-gray-600 dark:text-[#f6f9fa]/70 
                         "
              >
                Upload your first contract to get started
              </p>
            </div>
          </div>
        ) : (
          <div
            className="dark:dark-card bg-white dark:bg-gradient-to-br 
                       dark:from-[#062f3a] dark:to-[#083c5a] 
                       rounded-xl border border-gray-200 
                       dark:border-[#12e9ee]/10 
                       shadow-lg dark:shadow-[#12e9ee]/5 
                       overflow-hidden"
          >
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-4 
                         border-b border-gray-100 
                         dark:border-[#12e9ee]/10 
                         hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 
                         transition-colors duration-200 
                         last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg bg-[#486ebb]/10 
                              dark:bg-[#486ebb]/20"
                  >
                    <FileText
                      className="w-6 h-6 text-[#486ebb] 
                                     dark:text-[#486ebb]"
                    />
                  </div>
                  <div>
                    <h3
                      className="  font-medium 
                               text-gray-900 dark:text-[#f6f9fa]"
                    >
                      {contract.name}
                    </h3>
                    <p
                      className="text-sm   
                              text-gray-600 dark:text-[#f6f9fa]/70"
                    >
                      Uploaded on {contract.uploadedAt} • {contract.size}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(contract.id)}
                  className="flex items-center gap-2 px-3 py-1.5 
                         bg-teal-500 dark:bg-[#12e9ee] 
                         text-white dark:text-[#040a14] 
                         rounded-lg hover:bg-teal-600 
                         dark:hover:bg-[#12e9ee]/90 
                         transition-all duration-300 
                           dark:glow-teal 
                         group"
                >
                  <Download
                    className="w-4 h-4 group-hover:scale-110 
                                  transition-transform duration-300"
                  />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsPage;
