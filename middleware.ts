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

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ["/dashboard", "/profile", "/discover", "/matches", "/onboarding"];
  
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and tries to access login, redirect to dashboard
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/discover/:path*", "/matches/:path*", "/onboarding/:path*", "/login"],
};