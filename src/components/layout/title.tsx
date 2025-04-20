import React from "react";

const Title = ({ title }: { title: string }) => {
  return (
    <h1 className="text-4xl font-bold mb-2 text-black dark:text-[#12e9ee]">
      {title}
    </h1>
  );
};

export default Title;
