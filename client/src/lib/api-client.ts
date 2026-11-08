import type { ApiResponse, Person, Site, Visit } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Set it in client/.env.local.",
    );
  }

  return apiUrl;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "We couldn't reach Small Web. Check that the API is running and try again.",
      0,
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(" ")
          : String(payload.message)
        : "The request couldn't be completed. Please try again.";
    throw new ApiError(message, response.status);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload)
  ) {
    throw new ApiError("The API returned an unexpected response.", response.status);
  }

  return (payload as ApiResponse<T>).data;
}

export const api = {
  getPeople: () => request<Person[]>("/people"),
  getSites: () => request<Site[]>("/sites"),
  getSite: (address: string) =>
    request<Site>(`/sites/${encodeURIComponent(address)}`),
  searchSites: (query: string) =>
    request<Site[]>(`/search?q=${encodeURIComponent(query)}`),
  getVisits: (personId: string, limit = 50) =>
    request<Visit[]>(
      `/visits/${encodeURIComponent(personId)}?limit=${limit}`,
    ),
  publishSite: (site: {
    address: string;
    title: string;
    html: string;
    authorId: string;
  }) =>
    request<Site>("/sites", {
      method: "POST",
      body: JSON.stringify(site),
    }),
};
