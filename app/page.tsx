import { TEMPLATES } from "@/lib/templates";
import CreateSessionForm from "@/components/CreateSessionForm";

export default function HomePage() {
  return (
    <div className="container-narrow">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          建立一場 Retro
        </h1>
        <p className="mt-2 text-sm text-muted">
          選一套問卷、產生分享連結，讓 2–5 人的小組互相給回饋。系統會即時把關回饋是否有建設性。
        </p>
      </div>
      <CreateSessionForm templates={TEMPLATES} />
    </div>
  );
}
