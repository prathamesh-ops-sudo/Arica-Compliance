import { createRoot } from "react-dom/client";
import { initProductionSecurity } from "./lib/logger";
import App from "./App.tsx";
import "./index.css";

// Initialize production security measures
initProductionSecurity();

createRoot(document.getElementById("root")!).render(<App />);
