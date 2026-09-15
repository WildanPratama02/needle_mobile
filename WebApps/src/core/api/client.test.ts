import axios, { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiClient,
  DEFAULT_ERROR_MESSAGE,
  getApiErrorMessage,
  refreshAccessToken,
  SERVER_UNREACHABLE_MESSAGE,
} from "./client";
import { clearTokens, setRefreshToken } from "@/core/security/token-store";

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function responseError(status: number, data: unknown): AxiosError {
  const response = { status, statusText: "", data, headers: {}, config } as AxiosResponse;
  return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response);
}

function envelope(message: string) {
  return { success: false, error: { code: "UNAUTHORIZED", message, details: [] }, meta: { requestId: "REQ-TEST" } };
}

describe("getApiErrorMessage", () => {
  it("passes the backend envelope message through unchanged", () => {
    const error = responseError(401, envelope("Invalid credentials or inactive user"));

    expect(getApiErrorMessage(error)).toBe("Invalid credentials or inactive user");
    expect(getApiErrorMessage(error, "Custom fallback")).toBe("Invalid credentials or inactive user");
  });

  it("passes an envelope message through even on a 5xx — the backend answered", () => {
    expect(getApiErrorMessage(responseError(500, envelope("Something went wrong. Please try again.")))).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("reports the server as unreachable when the request got no response at all", () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, {});

    expect(getApiErrorMessage(error)).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it("reports the server as unreachable on a timeout", () => {
    const error = new AxiosError("timeout of 30000ms exceeded", AxiosError.ECONNABORTED, config, {});

    expect(getApiErrorMessage(error)).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it("reports the server as unreachable on the proxy's own non-envelope 500 (Next rewrite, backend down)", () => {
    // Exactly what next/dist/server/lib/router-utils/proxy-request.js writes
    // when the rewrite target refuses the connection.
    expect(getApiErrorMessage(responseError(500, "Internal Server Error"))).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it.each([502, 503, 504])("reports the server as unreachable on a non-envelope %i from a gateway", (status) => {
    expect(getApiErrorMessage(responseError(status, "<html><body>Bad Gateway</body></html>"))).toBe(
      SERVER_UNREACHABLE_MESSAGE
    );
  });

  it("prefers the unreachable message over a caller's custom fallback — the fallback describes a server answer", () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, {});

    expect(getApiErrorMessage(error, "This reset link is invalid or has expired.")).toBe(SERVER_UNREACHABLE_MESSAGE);
  });

  it("uses the fallback for a non-envelope 4xx — something answered, it is not an outage", () => {
    const error = responseError(404, "<html>Not Found</html>");

    expect(getApiErrorMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getApiErrorMessage(error, "Custom fallback")).toBe("Custom fallback");
  });

  it("uses the fallback for a cancelled request — the user or the app aborted it, the server is fine", () => {
    const error = new AxiosError("canceled", AxiosError.ERR_CANCELED, config, {});

    expect(getApiErrorMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it("uses the fallback for a non-axios error, and for no error at all", () => {
    expect(getApiErrorMessage(new Error("boom"))).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getApiErrorMessage(new Error("boom"), "Custom fallback")).toBe("Custom fallback");
    expect(getApiErrorMessage(undefined, "You do not have access to this resource.")).toBe(
      "You do not have access to this resource."
    );
  });
});

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearTokens();
  });

  it("calls the API on the WebApp's own origin, so the browser never makes a cross-origin request", () => {
    expect(apiClient.defaults.baseURL).toBe("/api/v1");
  });

  it("refreshes the token through the same same-origin path", async () => {
    setRefreshToken("refresh-token");
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "next-access", refreshToken: "next-refresh", expiresIn: 900 } },
    });

    await expect(refreshAccessToken()).resolves.toBe("next-access");
    expect(post).toHaveBeenCalledWith("/api/v1/auth/refresh", { refreshToken: "refresh-token" });
  });
});
