import axios from "axios";

import { api } from "@/app/api/axiosInstance";

interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly organizationId: string;
  readonly role: "ADMIN" | "OPERATOR" | "COORDINATOR";
}

interface LoginResponse {
  readonly success: true;
  readonly data: {
    readonly user: AuthenticatedUser;
  };
}

interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
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
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data.error.message ??
          "Tidak dapat terhubung ke server EcoPoin.",
      );
    }

    throw error;
  }
}
