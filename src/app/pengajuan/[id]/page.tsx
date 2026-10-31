import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/admin/validation.mjs";
import { getDraftEditor } from "@/lib/drafts/data";
import { validateDraftDocument } from "@/lib/drafts/schema.mjs";
import { DraftWizard } from "@/components/draft-wizard";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draf inovasi", robots: { index:false,follow:false } };
export default async function DraftEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id }=await params;
  if(!isUuid(id)) notFound();
  const { draft,territories,themes,simulation }=await getDraftEditor(id);
  if(!draft) notFound();
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8"><DraftWizard key={draft.id} draftId={draft.id} initialDocument={validateDraftDocument(draft.document).data} initialVersion={draft.revision} initialStep={draft.current_step} initialSavedAt={draft.updated_at} territories={territories} themes={themes} existingSimulation={simulation} /></main>;
}
