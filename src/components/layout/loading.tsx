"use client";
import React, { useState, useEffect } from "react";
import Logo from "./logo";

const Loading = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Add a random increment between 1-5%
        return Math.min(prevProgress + Math.random() * 4 + 1, 100);
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#040a14]">
      <div className="mb-2">
        <Logo />
      </div>

      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-[#083c5a] dark:bg-[#12e9ee] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Progress percentage */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {Math.round(progress)}%
      </p>
    </div>
  );
};

export default Loading;
