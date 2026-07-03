import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import AuthModal from "@/components/AuthModal";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="container-narrow">
      <div className="card flex items-center justify-between">
        <p className="text-sm text-muted">請先登入或註冊。</p>
        <div className="flex gap-2">
          <AuthModal label="登入" variant="nav" defaultTab="login" />
          <AuthModal label="註冊" variant="primary" defaultTab="register" />
        </div>
      </div>
    </div>
  );
}
