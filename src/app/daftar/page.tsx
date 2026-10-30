import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
export const metadata: Metadata = { title: "Daftar akun warga" };
export default function SignupPage() { return <AuthScreen mode="signup" />; }
