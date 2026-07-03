import ReactMarkdown from "react-markdown";
import { getT } from "@/lib/i18n/server";

export default async function ReportView({
  report,
  generatedAt,
}: {
  report: string | null;
  generatedAt: string | null;
}) {
  const { t } = await getT();
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-lg font-semibold">{t("rv.title")}</h2>
      {report ? (
        <>
          {generatedAt && (
            <p className="mt-1 text-xs text-muted">
              {t("rv.generatedAt", {
                date: new Date(generatedAt).toLocaleString(),
              })}
            </p>
          )}
          <div className="prose-sm card mt-3 max-w-none [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:text-sm [&_ul]:my-2">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">{t("rv.none")}</p>
      )}
    </section>
  );
}
