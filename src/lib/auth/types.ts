export type AuthMode = "login" | "signup" | "reset" | "password" | "profile";
export type AuthActionState = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
};
