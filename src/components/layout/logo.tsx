import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <div className="flex justify-center">
      <div className="relative w-28 flex items-center overflow-hidden h-16 justify-center">
        <img src="/xpips-logo.png" alt="XPIPS" className="w-28" />
      </div>
    </div>
  );
};

export default Logo;
