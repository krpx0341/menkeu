"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <h1 className="mb-1 text-xl font-semibold text-neutral-100">Menkeu</h1>
        <p className="mb-6 text-sm text-neutral-400">Masuk untuk lihat keuangan kamu.</p>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="mb-3 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-indigo-500"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
