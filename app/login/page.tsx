import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="container-narrow">
      <LoginForm />
    </div>
  );
}
