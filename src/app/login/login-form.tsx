"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- local SVG, next/image's optimizer blocks SVGs by default */}
        <img src="/brand/logo-mark.svg" alt="" width={48} height={48} className="mb-3 h-12 w-12 rounded-2xl" />
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Menkeu</h1>
        <p className="mt-1 text-sm text-slate-500">Masuk untuk lihat keuangan kamu.</p>
      </div>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="sr-only">
        Password
      </label>
      <input
        id="password"
        type="password"
        name="password"
        placeholder="Password"
        autoFocus
        required
        className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
