import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('=== MAIN.TSX LOADING ===');
console.log('React:', !!React);
console.log('createRoot:', !!createRoot);
console.log('App:', !!App);

try {
  const rootElement = document.getElementById("root");
  console.log('Root element found:', !!rootElement);
  
  if (rootElement) {
    const root = createRoot(rootElement);
    console.log('React root created successfully');
    root.render(<App />);
    console.log('App rendered successfully');
  } else {
    console.error('Root element not found!');
  }
} catch (error) {
  console.error('Failed to render app:', error);
}
