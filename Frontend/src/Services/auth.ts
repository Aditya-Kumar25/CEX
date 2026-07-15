import { apiRequest } from "./http";

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  username: string;
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  msg?: string;
};

export async function loginUser(
  input: LoginInput,
) {
  const data = await apiRequest<LoginResponse>(
    "/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  localStorage.setItem("token", data.token);

  return data;
}

export async function signupUser(
  input: SignupInput,
) {
  return apiRequest("/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginGoogleUser(token: string) {
  const data = await apiRequest<LoginResponse>(
    "/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    },
  );

  localStorage.setItem("token", data.token);

  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}