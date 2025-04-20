"use client";
import React, { useState } from "react";
import { Plus, Pencil, Mail, Search } from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content?: string;
}

const MessagesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: "1",
      name: "AccountBreachAlert",
      subject: "Breach Detected - Aura Funded",
    },
    {
      id: "2",
      name: "Confidential Information",
      subject: "Confidential information of user : {uid} -- Account : {uacc}",
    },
    {
      id: "3",
      name: "ForgotPassword",
      subject: "Password requested - {site_name}",
    },
    {
      id: "4",
      name: "NewAdminRegistered",
      subject: "New admin account registered",
    },
    {
      id: "5",
      name: "NewTradingAccount",
      subject: "Your Metatrader Credentials",
    },
    {
      id: "6",
      name: "NewUserAccount",
      subject: "Dashboard Credentials - Welcome To Aura Funded",
    },
  ]);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto min-h-screen bg-white dark:bg-[#040a14] text-black dark:text-[#f6f9fa]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-4xl font-clash-display font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent
                     dark:from-[#12e9ee] dark:to-[#486ebb]"
          >
            Message Templates
          </h1>
          <p className="text-gray-600 dark:text-[#f6f9fa]/80 font-clash-grotesk">
            Manage and customize your email templates
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 dark:bg-[#12e9ee] 
                       text-white dark:text-[#040a14] rounded-lg 
                       hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                       transition-all duration-300 font-clash-grotesk 
                       dark:glow-teal group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Create Template</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#f6f9fa]/60" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#12e9ee]/20 
                     rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 
                     dark:text-[#f6f9fa] focus:outline-none focus:ring-2 
                     focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                     font-clash-grotesk transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div
        className="bg-white dark:dark-card shadow-lg dark:shadow-[#12e9ee]/5
                   dark:bg-gradient-to-br dark:from-[#062f3a] dark:to-[#083c5a]
                   rounded-xl border border-gray-100 dark:border-[#12e9ee]/10 
                   overflow-hidden backdrop-blur-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#12e9ee]/20">
                <th
                  className="px-6 py-4 text-left text-sm font-clash-grotesk font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Name
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-clash-grotesk font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80"
                >
                  Subject
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-clash-grotesk font-semibold 
                           text-gray-600 dark:text-[#f6f9fa]/80 w-[100px]"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr
                  key={template.id}
                  className="border-b border-gray-200 dark:border-[#12e9ee]/20 last:border-b-0 
                           hover:bg-gray-50 dark:hover:bg-[#12e9ee]/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg bg-teal-50 dark:bg-[#12e9ee]/10 
                                  group-hover:animate-glow"
                      >
                        <Mail className="w-5 h-5 text-teal-500 dark:text-[#12e9ee]" />
                      </div>
                      <span className="font-clash-grotesk font-medium text-gray-900 dark:text-[#f6f9fa]">
                        {template.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-clash-grotesk text-gray-500 dark:text-[#f6f9fa]/60">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="flex items-center gap-1 font-clash-grotesk text-[#486ebb] 
                                   hover:text-[#12e9ee] transition-colors group"
                    >
                      <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Edit Template</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 font-clash-grotesk text-gray-500 dark:text-[#f6f9fa]/60">
          No templates found matching your search.
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
