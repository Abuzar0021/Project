/** Every draft, optionally filtered by ?tag=. */

import { Suspense } from "react";
import { DraftList } from "@/components/app/DraftList";

export default function DraftsPage() {
  return (
    <Suspense>
      <DraftList />
    </Suspense>
  );
}
