import axios from "axios";

import { api } from "@/app/api/axiosInstance";

interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly organizationId: string;
  readonly role: "ADMIN" | "OPERATOR" | "COORDINATOR";
}

interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

type LoginResponse = ApiSuccessResponse<{ user: AuthenticatedUser }>;
type MeResponse = ApiSuccessResponse<{ user: AuthenticatedUser }>;
type LogoutResponse = ApiSuccessResponse<Record<string, never>>;

const DEFAULT_ERROR_MESSAGE = "Tidak dapat terhubung ke server EcoPoin.";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? fallback;
  }
  return fallback;
}

export async function authUser(
  email: string,
  password: string,
): Promise<AuthenticatedUser> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    return response.data.data.user;
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const response = await api.get<MeResponse>("/auth/me");
    return response.data.data.user;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Not logged in / session expired — this is an expected outcome,
      // not an error the caller needs to surface to the user.
      return null;
    }
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}


export async function logoutUser(): Promise<void> {
  try {
    await api.post<LogoutResponse>("/auth/logout");
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, DEFAULT_ERROR_MESSAGE));
  }
}