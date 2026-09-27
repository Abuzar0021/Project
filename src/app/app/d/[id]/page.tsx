import { DraftView } from "@/components/app/DraftView";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DraftView id={id} />;
}
