import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(path: string | null): string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return "/dashboard";
  }
  return path;
}

function redirectToLogin(request: NextRequest, authError: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("authError", authError);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(
      request,
      providerError === "access_denied" ? "cancelled" : "callback",
    );
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) return redirectToLogin(request, "callback");

  const supabase = await createClient(
    requestUrl.searchParams.get("remember") !== "0",
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectToLogin(request, "callback");

  return NextResponse.redirect(
    new URL(getSafeNextPath(requestUrl.searchParams.get("next")), request.url),
  );
}
