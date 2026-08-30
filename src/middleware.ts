import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "menkeu_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/telegram") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie !== process.env.SESSION_SECRET) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/telegram|_next/static|_next/image|favicon.ico).*)"],
};
