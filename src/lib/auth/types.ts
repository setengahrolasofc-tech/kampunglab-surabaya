export type AuthActionState = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  /** "otp": kode sudah dikirim ke `email`; tampilkan isian kode. */
  step?: "otp";
  purpose?: "signup" | "recovery";
  email?: string;
};
