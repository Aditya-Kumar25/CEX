import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";

import ProtectedRoute from "../Components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    element: <ProtectedRoute />,

    children: [
      {
        path: "/",
        element: (
          <Navigate
            to="/trade/BTC"
            replace
          />
        ),
      },

      {
        path: "/dashboard",
        element: (
          <Navigate
            to="/trade/BTC"
            replace
          />
        ),
      },

      {
        path: "/trade/:symbol",
        element: <Dashboard />,
      },
    ],
  },

  {
    path: "*",

    element: (
      <Navigate
        to="/trade/BTC"
        replace
      />
    ),
  },
]);