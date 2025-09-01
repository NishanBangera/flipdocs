"use client";

import { FlipbookViewer } from "../../components/flipbook/flipbook-viewer";
import { FlipbookProviders } from "../../components/flipbook/flipbook-providers";
import { useFlipbookBySlug } from "../../../lib/hooks/use-flipbook-by-slug";
import { ErrorState } from "@/app/components/ui/loading";

interface FlipbookViewerClientProps {
  slug: string;
}

function FlipbookContent({ slug }: { slug: string }) {
  const { data: flipbook, isLoading, error } = useFlipbookBySlug(slug);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
        <div className="text-white text-2xl">Loading flipbook...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
        <ErrorState
          message={error.message || "Failed to load flipbook"}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!flipbook) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
        <div className="text-white text-2xl">Flipbook not found</div>
      </div>
    );
  }

  if (!flipbook.is_published) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
        <div className="text-white text-2xl">This flipbook is not published</div>
      </div>
    );
  }

  return <FlipbookViewer flipbook={flipbook} />;
}

export function FlipbookViewerClient({ slug }: FlipbookViewerClientProps) {
  return (
    <FlipbookProviders>
      <FlipbookContent slug={slug} />
    </FlipbookProviders>
  );
}