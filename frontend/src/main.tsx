import { ClerkProvider } from "@clerk/react";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const clerk_key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerk_key) throw Error("Clerk Key not found");

const rootElement = document.getElementById("root");
if (!rootElement) throw Error("Root element not found");

createRoot(rootElement).render(
    <StrictMode>
        <ClerkProvider publishableKey={clerk_key}>
            <App />
        </ClerkProvider>
    </StrictMode>,
);
