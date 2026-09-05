import axios from "axios";
import { api } from "@/app/api/axiosInstance";

export interface DashboardData { readonly metrics: { readonly totalWeightKg: string; readonly totalAmount: string; readonly transactionCount: number; readonly activeMemberCount: number; readonly savingsAmount: string; readonly cashAmount: string }; readonly recentTransactions: readonly { readonly id: string; readonly memberName: string; readonly totalWeightKg: string; readonly totalAmount: string; readonly payoutMethod: "DIRECT_CASH" | "SAVINGS" | null; readonly createdAt: string }[]; readonly wasteComposition: readonly { readonly name: string; readonly weightKg: string; readonly amount: string }[]; }
interface Response { readonly success: true; readonly data: DashboardData; }
export async function getDashboard(): Promise<DashboardData> { try { return (await api.get<Response>("/dashboard")).data.data; } catch (error: unknown) { throw new Error(axios.isAxiosError(error) ? "Dashboard gagal dimuat dari server." : "Dashboard gagal dimuat."); } }
