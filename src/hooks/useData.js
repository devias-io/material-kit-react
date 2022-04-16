import React from "react";
import { useState, useEffect } from "react";

export default function useData() {
  const [id, setId] = useState();

  useEffect(() => {
    setId(localStorage.getItem("bakoelUserId"));
  }, []);
  return { id };
}
