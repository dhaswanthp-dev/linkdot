import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "../database.extended.types";

export async function createClient(rememberSession = true) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (rememberSession) {
            cookieStore.set(name, value, options);
          } else {
            const sessionOptions = { ...options };
            delete sessionOptions.maxAge;
            delete sessionOptions.expires;
            cookieStore.set(name, value, sessionOptions);
          }
        }
      },
    },
  });
}
