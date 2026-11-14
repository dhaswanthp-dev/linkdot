import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../database.extended.types";

let rememberSession = true;

export function setRememberSession(remember: boolean) {
  rememberSession = remember;
}

function getBrowserCookies() {
  if (typeof document === "undefined" || !document.cookie) return [];

  return document.cookie.split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      return [{ name, value: decodeURIComponent(value) }];
    } catch {
      return [{ name, value }];
    }
  });
}

function setBrowserCookies(
  cookies: {
    name: string;
    value: string;
    options: {
      domain?: string;
      expires?: Date;
      maxAge?: number;
      path?: string;
      sameSite?: boolean | "lax" | "none" | "strict";
      secure?: boolean;
    };
  }[],
) {
  if (typeof document === "undefined") return;

  for (const { name, value, options } of cookies) {
    const attributes = [
      `Path=${options.path ?? "/"}`,
      `SameSite=${typeof options.sameSite === "string" ? options.sameSite : "lax"}`,
    ];
    if (options.domain) attributes.push(`Domain=${options.domain}`);
    if (options.secure || window.location.protocol === "https:") {
      attributes.push("Secure");
    }

    if (options.maxAge === 0) {
      attributes.push("Max-Age=0");
    } else if (rememberSession) {
      attributes.push(`Max-Age=${options.maxAge ?? 400 * 24 * 60 * 60}`);
      if (options.expires) {
        attributes.push(`Expires=${options.expires.toUTCString()}`);
      }
    }

    document.cookie = `${name}=${encodeURIComponent(value)}; ${attributes.join("; ")}`;
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.",
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: getBrowserCookies,
      setAll: setBrowserCookies,
    },
  });
}
