import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  getToken,
  loginUser,
  logoutUser,
} from "../Services/auth";

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextType = {
  authenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [authenticated, setAuthenticated] =
    useState(Boolean(getToken()));

  async function login(input: LoginInput) {
    await loginUser(input);

    setAuthenticated(true);
  }

  function logout() {
    logoutUser();

    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}