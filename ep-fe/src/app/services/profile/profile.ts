import axios from "axios";
import { api } from "@/app/api/axiosInstance";

export interface Profile {
  readonly id: string; readonly email: string; readonly fullName: string;
  readonly role: "ADMIN" | "OPERATOR" | "COORDINATOR";
  readonly organization: { readonly id: string; readonly name: string; readonly address: string | null; readonly contactPhone: string | null };
}
export interface UpdateProfilePayload { readonly fullName?: string; readonly organizationName?: string; readonly address?: string | null; readonly contactPhone?: string | null }
interface Response { readonly success: true; readonly data: { readonly profile: Profile } }
interface ErrorResponse { readonly success: false; readonly error: { readonly message: string } }

function message(error: unknown): string { return axios.isAxiosError<ErrorResponse>(error) ? error.response?.data.error.message ?? "Profil gagal diproses." : "Profil gagal diproses."; }
export async function getProfile(): Promise<Profile> { try { return (await api.get<Response>("/profile")).data.data.profile; } catch (error: unknown) { throw new Error(message(error)); } }
export async function updateProfile(payload: UpdateProfilePayload): Promise<Profile> { try { return (await api.patch<Response>("/profile", payload)).data.data.profile; } catch (error: unknown) { throw new Error(message(error)); } }
