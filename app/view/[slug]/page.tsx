"use client";

import { use, Suspense } from "react";
import { FlipbookViewer } from "../../components/flipbook/flipbook-viewer";
import { FlipbookProviders } from "../../components/flipbook/flipbook-providers";
import { useFlipbookBySlug } from "../../../lib/hooks/use-flipbook-by-slug";
import { ErrorState } from "@/app/components/ui/loading";

interface ViewFlipbookPageProps {
  params: Promise<{ slug: string }>;
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

  // Use flipbook-specific background image if available; otherwise use a light purple background
  const hasBackground = Boolean(flipbook.background_image_url);
  const bgStyle = hasBackground
    ? { backgroundImage: `url(${flipbook.background_image_url})` }
    : undefined;
  // Always include a light purple background color so it shows if the image fails to load
  const bgClasses = hasBackground
    ? "bg-violet-900 bg-cover bg-center bg-no-repeat"
    : "bg-violet-900"; // light purple fallback

  return (
    <div
      data-route="view"
      className={`fixed inset-0 w-full h-full overflow-hidden ${bgClasses}`}
      style={bgStyle}
    >
      <FlipbookViewer flipbook={flipbook} />
    </div>
  );
}

export default function ViewFlipbookPage({ params }: ViewFlipbookPageProps) {
  const { slug } = use(params);

  return (
    <FlipbookProviders>
      <div 
        data-route="view"
        className="fixed inset-0 w-full h-full overflow-hidden bg-violet-100"
      >
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
            <div className="text-white text-2xl">Loading...</div>
          </div>
        }>
          <FlipbookContent slug={slug} />
        </Suspense>
      </div>
    </FlipbookProviders>
  );
}