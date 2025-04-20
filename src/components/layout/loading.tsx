"use client";
import Logo from "./logo";
const Loading = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#040a14]">
      <div className="mb-2 animate-pulse">
        <Logo />
      </div>
    </div>
  );
};

export default Loading;
