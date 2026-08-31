"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "menkeu_session";

export async function login(_prev: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password || password !== process.env.APP_PASSWORD) {
    return "Password salah.";
  }
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("Missing SESSION_SECRET env var");

  const jar = await cookies();
  jar.set(COOKIE, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/login");
}
