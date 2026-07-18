import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          response = NextResponse.next({
            request,
          });
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/profile", "/discover", "/matches", "/onboarding", "/messages", "/favorites"];

  // Not logged in trying to access a protected route
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in — check onboarding status for protected routes (except onboarding itself)
  if (session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle();

    const onboardingDone = profile?.onboarding_completed === true;

    // Not onboarded yet, and not already heading to onboarding -> force onboarding
    if (!onboardingDone && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Already onboarded, but trying to revisit onboarding -> send to dashboard
    if (onboardingDone && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If user is logged in and tries to access login, redirect to dashboard
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/discover/:path*", "/matches/:path*", "/onboarding/:path*", "/messages/:path*", "/favorites/:path*", "/login"],
};