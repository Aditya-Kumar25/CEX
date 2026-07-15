import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { router } from "./router/router";
import { AuthProvider } from "./Context/AuthContext";

import "./index.css";

console.log("[Frontend Startup] window.location.origin =", window.location.origin);

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);