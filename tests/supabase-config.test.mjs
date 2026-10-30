import assert from "node:assert/strict";
import test from "node:test";
import { getSupabasePublicConfig } from "../src/lib/supabase/config.mjs";

const url = "https://example.supabase.co";
const publicKey = "sb_publishable_example_only";

test("accepts hosted public configuration and normalizes a trailing slash", () => {
  assert.deepEqual(getSupabasePublicConfig(`${url}/`, publicKey), {
    url,
    publishableKey: publicKey,
  });
});

test("missing configuration fails before creating a network client", () => {
  for (const args of [[undefined, publicKey], [url, undefined], ["", ""]]) {
    assert.throws(() => getSupabasePublicConfig(...args), /Isi NEXT_PUBLIC_SUPABASE_URL/);
  }
});

test("privileged, legacy, and placeholder keys are rejected without echoing them", () => {
  for (const key of ["sb_secret_sensitive_example", "eyJlegacy-sensitive-example", "your-publishable-key"]) {
    assert.throws(() => getSupabasePublicConfig(url, key), (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /harus memakai sb_publishable_/);
      assert.ok(!error.message.includes(key));
      return true;
    });
  }
});

test("rejects insecure, credentialed, or unexpected API base URLs", () => {
  for (const candidate of [
    "http://example.supabase.co",
    "https://user:password@example.supabase.co",
    `${url}/rest/v1`,
    `${url}?apikey=not-allowed`,
    `${url}#fragment`,
    "not a url",
  ]) {
    assert.throws(() => getSupabasePublicConfig(candidate, publicKey));
  }
});
