"use client";
import React, { useState } from "react";
import { Upload, AlertCircle, FileText, Trash2 } from "lucide-react";

interface KYCDocument {
  id: string;
  type: "identity" | "address" | "selfie";
  status: "pending" | "verified" | "rejected";
  fileName: string;
  uploadedAt: string;
}

const KYCPage = () => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);

  const documentTypes = [
    {
      type: "identity",
      title: "Proof of Identity",
      description:
        "Upload a valid government-issued ID (Passport, Driver's License)",
      accepted: ".jpg, .jpeg, .png, .pdf",
    },
    {
      type: "address",
      title: "Proof of Address",
      description:
        "Recent utility bill or bank statement (not older than 3 months)",
      accepted: ".jpg, .jpeg, .png, .pdf",
    },
    {
      type: "selfie",
      title: "Selfie Verification",
      description: "Clear photo of yourself holding your ID document",
      accepted: ".jpg, .jpeg, .png",
    },
  ];

  const handleFileUpload = (
    type: "identity" | "address" | "selfie",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Remove existing document of the same type
      const filteredDocs = documents.filter((doc) => doc.type !== type);

      // Add new document
      const newDocument: KYCDocument = {
        id: Date.now().toString(),
        type,
        status: "pending",
        fileName: file.name,
        uploadedAt: new Date().toISOString().split("T")[0],
      };

      setDocuments([...filteredDocs, newDocument]);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1
            className="text-3xl font-clash-display font-bold 
                      text-gray-900 dark:text-[#f6f9fa] mb-2"
          >
            KYC Verification
          </h1>
          <p
            className="text-gray-600 dark:text-[#f6f9fa]/70 
                     font-clash-grotesk"
          >
            Complete your verification by uploading the required documents
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {documentTypes.map(({ type, title, description, accepted }) => {
            const existingDoc = documents.find((doc) => doc.type === type);

            return (
              <div
                key={type}
                className="dark:dark-card bg-white dark:bg-gradient-to-br 
                        dark:from-[#062f3a] dark:to-[#083c5a] 
                        rounded-xl p-6 border border-gray-200 
                        dark:border-[#12e9ee]/10 
                        shadow-lg dark:shadow-[#12e9ee]/5"
              >
                <h2
                  className="text-xl font-clash-display font-semibold 
                           text-gray-900 dark:text-[#f6f9fa] mb-2"
                >
                  {title}
                </h2>
                <p
                  className="text-gray-600 dark:text-[#f6f9fa]/70 
                          font-clash-grotesk text-sm mb-4"
                >
                  {description}
                </p>

                {existingDoc ? (
                  <div
                    className="border border-gray-200 dark:border-[#12e9ee]/10 
                              rounded-lg p-4 bg-gray-50 
                              dark:bg-[#12e9ee]/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg bg-[#486ebb]/10 
                                    dark:bg-[#486ebb]/20"
                        >
                          <FileText className="w-5 h-5 text-[#486ebb]" />
                        </div>
                        <div>
                          <p
                            className="font-clash-grotesk font-medium 
                                    text-gray-900 dark:text-[#f6f9fa]"
                          >
                            {existingDoc.fileName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-clash-grotesk 
                                         ${getStatusBadgeClasses(
                                           existingDoc.status
                                         )}`}
                            >
                              {existingDoc.status.charAt(0).toUpperCase() +
                                existingDoc.status.slice(1)}
                            </span>
                            <span
                              className="text-sm font-clash-grotesk 
                                         text-gray-600 dark:text-[#f6f9fa]/70"
                            >
                              • Uploaded on {existingDoc.uploadedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(existingDoc.id)}
                        className="p-2 text-red-500 dark:text-red-400 
                               hover:bg-red-50 dark:hover:bg-red-500/10 
                               rounded-full transition-all duration-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id={`file-upload-${type}`}
                      className="hidden"
                      accept={accepted}
                      onChange={(e) => handleFileUpload(type as any, e)}
                    />
                    <label
                      htmlFor={`file-upload-${type}`}
                      className="flex flex-col items-center gap-2 p-6 
                             border-2 border-dashed 
                             border-gray-200 dark:border-[#12e9ee]/20 
                             rounded-lg cursor-pointer 
                             hover:border-teal-500 dark:hover:border-[#12e9ee] 
                             transition-all duration-300 
                             group"
                    >
                      <div
                        className="p-3 rounded-lg bg-[#486ebb]/10 
                                  dark:bg-[#486ebb]/20 
                                  group-hover:bg-teal-500/10 
                                  dark:group-hover:bg-[#12e9ee]/20 
                                  transition-colors duration-300"
                      >
                        <Upload
                          className="w-8 h-8 text-[#486ebb] 
                                       group-hover:text-teal-500 
                                       dark:group-hover:text-[#12e9ee] 
                                       transition-colors duration-300"
                        />
                      </div>
                      <span
                        className="text-sm font-clash-grotesk font-medium 
                                   text-gray-900 dark:text-[#f6f9fa]"
                      >
                        Click to upload or drag and drop
                      </span>
                      <span
                        className="text-xs font-clash-grotesk 
                                   text-gray-600 dark:text-[#f6f9fa]/70"
                      >
                        Supported formats: {accepted}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {documents.length > 0 && (
          <div
            className="dark:dark-card bg-white dark:bg-gradient-to-br 
                       dark:from-[#062f3a] dark:to-[#083c5a] 
                       rounded-xl p-6 border border-gray-200 
                       dark:border-[#12e9ee]/10"
          >
            <div className="flex items-center gap-2">
              <div
                className="p-2 rounded-lg bg-[#486ebb]/10 
                          dark:bg-[#486ebb]/20"
              >
                <AlertCircle className="w-5 h-5 text-[#486ebb]" />
              </div>
              <p
                className="text-sm font-clash-grotesk 
                         text-gray-600 dark:text-[#f6f9fa]/70"
              >
                Your documents are being reviewed. This process typically takes
                1-2 business days.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for status badge classes
const getStatusBadgeClasses = (status: string) => {
  const baseClasses = "px-2 py-0.5 rounded-full";
  switch (status) {
    case "verified":
      return `${baseClasses} bg-green-100 text-green-800 
              dark:bg-[#12e9ee]/10 dark:text-[#12e9ee]`;
    case "rejected":
      return `${baseClasses} bg-red-100 text-red-800 
              dark:bg-red-500/10 dark:text-red-400`;
    default:
      return `${baseClasses} bg-yellow-100 text-yellow-800 
              dark:bg-[#486ebb]/10 dark:text-[#486ebb]`;
  }
};

export default KYCPage;
