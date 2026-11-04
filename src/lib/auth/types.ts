export type AuthActionState = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  /** "otp": kode sudah dikirim ke `email`; tampilkan isian kode. */
  step?: "otp";
  purpose?: "signup" | "recovery";
  /** "lupa": belum masuk; "ubah": sudah masuk dan mengganti password (kode dikirim ke email akun yang sedang masuk). */
  mode?: "lupa" | "ubah";
  email?: string;
};
