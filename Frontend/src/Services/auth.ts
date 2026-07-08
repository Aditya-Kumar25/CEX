import { apiRequest } from "./http";

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  name: string;
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

export function logoutUser() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}