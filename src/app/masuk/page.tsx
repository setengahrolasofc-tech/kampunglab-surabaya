import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
export const metadata: Metadata = { title: "Masuk" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return <AuthScreen mode="login" status={(await searchParams).status} />;
}
