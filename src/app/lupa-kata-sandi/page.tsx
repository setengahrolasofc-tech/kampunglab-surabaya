import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";
export const metadata: Metadata = { title: "Pulihkan kata sandi" };
export default function ResetPage() { return <AuthScreen mode="reset" />; }
