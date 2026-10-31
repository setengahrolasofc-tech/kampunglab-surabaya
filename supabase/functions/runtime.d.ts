// Minimal local declarations for static checking; Supabase supplies the Deno runtime.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): unknown;
};
