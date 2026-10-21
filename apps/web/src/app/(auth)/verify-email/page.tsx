import { VerifyEmail } from "@/features/auth/ui/VerifyEmail";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmail token={token ?? ""} />;
}
