"use client";
import React, { useState } from "react";
import { ArrowLeft, User, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

const AddUserPage = () => {
  const [formData, setFormData] = useState({
    userId: "",
    email: "",
    password: "",
    firstName: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.userId.includes(" ")) {
      setError("User ID cannot contain spaces");
      return;
    }
    if (formData.userId.length > 20) {
      setError("User ID must be 20 characters or less");
      return;
    }
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-gray-600 dark:text-[#f6f9fa]/70 
                     hover:text-gray-900 dark:hover:text-[#12e9ee] transition-colors 
                       group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Users</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1
            className="text-4xl   font-bold mb-2 
                       text-gray-900 dark:text-[#f6f9fa]
                       bg-gradient-to-r from-gray-900 to-gray-700 dark:from-[#12e9ee] dark:to-[#486ebb] 
                       bg-clip-text text-transparent"
          >
            Add New User
          </h1>
          <p className="text-gray-600 dark:text-[#f6f9fa]/70   text-lg">
            Create a new user account with specific permissions
          </p>
        </div>

        <div
          className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      rounded-xl border border-gray-200 dark:border-[#12e9ee]/10 
                      shadow-lg dark:shadow-[#12e9ee]/5 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 
                           text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2
                            "
              >
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2  
                               text-gray-700 dark:text-[#f6f9fa]/80"
                >
                  User ID
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                                text-gray-400 dark:text-[#12e9ee]"
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 dark:text-[#f6f9fa] 
                           focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                             transition-all duration-300"
                    placeholder="Enter user ID (max 20 characters)"
                    maxLength={20}
                    value={formData.userId}
                    onChange={(e) => {
                      setError(null);
                      setFormData({ ...formData, userId: e.target.value });
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#f6f9fa]/50 mt-2  ">
                  Up to 20 characters, no spaces, case sensitive
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2  
                               text-gray-700 dark:text-[#f6f9fa]/80"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                                text-gray-400 dark:text-[#12e9ee]"
                  />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 dark:text-[#f6f9fa] 
                           focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                             transition-all duration-300"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2  
                               text-gray-700 dark:text-[#f6f9fa]/80"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                                text-gray-400 dark:text-[#12e9ee]"
                  />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 dark:text-[#f6f9fa] 
                           focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                             transition-all duration-300"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2  
                               text-gray-700 dark:text-[#f6f9fa]/80"
                >
                  First Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 
                                text-gray-400 dark:text-[#12e9ee]"
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#12e9ee]/20 
                           rounded-lg bg-white dark:bg-[#062f3a] text-gray-800 dark:text-[#f6f9fa] 
                           focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-[#12e9ee]/50 
                             transition-all duration-300"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-teal-500 dark:bg-[#12e9ee] 
                         text-white dark:text-[#040a14] rounded-lg 
                         hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                         transition-all duration-300   
                         dark:glow-teal group relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 dark:bg-gradient-to-r 
                             dark:from-[#12e9ee]/0 dark:via-[#12e9ee]/10 
                             dark:to-[#12e9ee]/0 transform -skew-x-12 
                             opacity-0 group-hover:opacity-100 
                             transition-opacity duration-700"
                />
                <span
                  className="relative z-10 group-hover:scale-105 
                              transition-transform inline-block"
                >
                  Create User
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;
