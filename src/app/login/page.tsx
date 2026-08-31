import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 px-4">
      <LoginForm next={safeNext} />
    </div>
  );
}
