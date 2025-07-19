import React from "react";
import { createRoot } from "react-dom/client";

function SimpleTest() {
  return <div className="p-4">Simple Test Component Working!</div>;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<SimpleTest />);
}