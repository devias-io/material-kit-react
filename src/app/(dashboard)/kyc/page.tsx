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
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your verification by uploading the required documents
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {documentTypes.map(({ type, title, description, accepted }) => {
          const existingDoc = documents.find((doc) => doc.type === type);

          return (
            <div
              key={type}
              className="bg-card dark:bg-card rounded-xl p-6 shadow-lg border"
            >
              <h2 className="text-xl font-semibold mb-2 text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {description}
              </p>

              {existingDoc ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary-purple" />
                      <div>
                        <p className="font-medium text-foreground">
                          {existingDoc.fileName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${getStatusColor(
                              existingDoc.status
                            )}`}
                          >
                            {existingDoc.status.charAt(0).toUpperCase() +
                              existingDoc.status.slice(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • Uploaded on {existingDoc.uploadedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(existingDoc.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary-purple transition-colors"
                  >
                    <Upload className="w-8 h-8 text-primary-purple" />
                    <span className="text-sm font-medium">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
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
        <div className="mt-8 bg-card dark:bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">
              Your documents are being reviewed. This process typically takes
              1-2 business days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCPage;
