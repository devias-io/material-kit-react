import React from "react";

const Description = ({ description }: { description: string }) => {
  return (
    <p className="text-gray-600 dark:text-[#f6f9fa]/80  ">{description}</p>
  );
};

export default Description;
