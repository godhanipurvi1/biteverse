export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = { method?: string; body?: unknown };

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  const res = await fetch(`/api${path}`, {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 204) return null as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "Something went wrong";
    throw new ApiError(res.status, message);
  }
  return data as T;
}
