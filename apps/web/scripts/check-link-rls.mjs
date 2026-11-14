import { createClient } from "@supabase/supabase-js";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RLS_TEST_USER_A_EMAIL",
  "RLS_TEST_USER_A_PASSWORD",
  "RLS_TEST_USER_B_VISIBLE_LINK_ID",
];

function isPlaceholder(name, value) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("your-") ||
    normalized.includes("redacted") ||
    (name === "NEXT_PUBLIC_SUPABASE_URL" &&
      normalized.includes("example.com"))
  );
}

function hasServiceRoleClaim(key) {
  const parts = key.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a decodable JWT to verify its role.",
    );
  }

  let payload;
  try {
    payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY has an unreadable JWT payload.",
    );
  }

  return (
    typeof payload === "object" &&
    payload !== null &&
    payload.role === "service_role"
  );
}

async function main() {
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missingVariables.length > 0) {
    console.error(`Missing required variables: ${missingVariables.join(", ")}`);
    return 1;
  }

  const placeholderVariables = requiredVariables.filter((name) =>
    isPlaceholder(name, process.env[name].trim()),
  );
  if (placeholderVariables.length > 0) {
    console.error(
      `Placeholder values are not allowed for: ${placeholderVariables.join(", ")}`,
    );
    return 1;
  }

  const linkId = process.env.RLS_TEST_USER_B_VISIBLE_LINK_ID.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkId)) {
    console.error(
      "RLS_TEST_USER_B_VISIBLE_LINK_ID must be a UUID for a visible link owned by User B.",
    );
    return 1;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
  if (hasServiceRoleClaim(anonKey)) {
    console.error(
      "RLS check refused: NEXT_PUBLIC_SUPABASE_ANON_KEY has the service_role claim.",
    );
    return 1;
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let signInError;
  try {
    ({ error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.RLS_TEST_USER_A_EMAIL.trim(),
      password: process.env.RLS_TEST_USER_A_PASSWORD,
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sign-in error.";
    console.error(`User A sign-in failed: ${message}`);
    return 1;
  }

  if (signInError) {
    console.error(`User A sign-in failed: ${signInError.message}`);
    return 1;
  }

  let readPassed = false;
  let updatePassed = false;

  try {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("id")
        .eq("id", linkId);
      readPassed =
        data?.length === 0 || (data === null && Boolean(error));
      console.log(
        readPassed
          ? "Read check passed: no foreign link row was returned."
          : "Read check failed: user A can read user B's link.",
      );
    } catch {
      readPassed = true;
      console.log("Read check passed: the query returned an error.");
    }

    try {
      const { data, error } = await supabase
        .from("links")
        .update({ title: "rls-test-should-not-change" })
        .eq("id", linkId)
        .select("id");
      updatePassed =
        data?.length === 0 || (data === null && Boolean(error));
      console.log(
        updatePassed
          ? "Update check passed: no foreign link row was updated."
          : "Update check failed: user A updated user B's link.",
      );
    } catch {
      updatePassed = true;
      console.log("Update check passed: the query returned an error.");
    }
  } finally {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.log(`Sign-out check failed: ${signOutError.message}`);
        return 1;
      }
      console.log("Sign-out check passed.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sign-out error.";
      console.log(`Sign-out check failed: ${message}`);
      return 1;
    }
  }

  return readPassed && updatePassed ? 0 : 1;
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unexpected RLS check failure.";
    console.error(`RLS check failed: ${message}`);
    process.exitCode = 1;
  });
