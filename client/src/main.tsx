import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("main.tsx loading...");
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  console.log("Creating React root...");
  const root = createRoot(rootElement);
  console.log("Rendering App...");
  root.render(<App />);
  console.log("App rendered!");
} else {
  console.error("Root element not found!");
}
