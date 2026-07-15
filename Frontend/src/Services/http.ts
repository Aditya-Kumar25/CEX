import { API_URL } from "../config";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  // Temporary logging for tracing requests/responses
  console.log(`[HTTP Response Log] Request URL: ${API_URL}${endpoint}, Status: ${response.status}, Content-Type: ${contentType}, Body length: ${responseText.length}`);

  if (!contentType.includes("application/json")) {
    console.error(`[HTTP Response Log] Expected application/json but received Content-Type: "${contentType}" from URL: ${API_URL}${endpoint}. Body starts with:`, responseText.substring(0, 200));
    throw new Error(`Server returned HTML/Text instead of JSON. Status: ${response.status}`);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error(`[HTTP Response Log] Failed to parse JSON response from URL: ${API_URL}${endpoint}. Body starts with:`, responseText.substring(0, 200));
    throw new Error(`Invalid JSON response. Status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      data.msg || data.message || "Something went wrong",
    );
  }

  return data;
}