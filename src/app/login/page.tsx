import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="flex min-h-full items-center justify-center bg-neutral-950 px-4">
      <LoginForm next={safeNext} />
    </div>
  );
}
