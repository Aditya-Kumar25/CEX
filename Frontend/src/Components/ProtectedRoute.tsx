import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../Context/AuthContext";

export default function ProtectedRoute() {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}