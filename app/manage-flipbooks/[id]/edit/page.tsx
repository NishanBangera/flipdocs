"use client";

import { useParams, useRouter } from "next/navigation";
import { useFlipbook } from "@/lib/hooks/use-flipbooks";
import { FlipbookFormScreen } from "../../../components/forms/flipbook-form-screen";
import { ErrorState, LoadingState } from "../../../components/ui/loading";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function EditFlipbookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data: flipbook, isLoading, error, refetch } = useFlipbook(id ?? "");

  return (
    <main className="flex flex-col h-full">
      {/* <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/manage-flipbooks">Manage Flipbooks</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Edit</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div> */}

      {isLoading && <LoadingState message="Loading flipbook..." />}
      {error && (
        <ErrorState message={error.message || "Failed to load flipbook"} onRetry={() => refetch()} />
      )}
      {!isLoading && !error && flipbook && (
        <FlipbookFormScreen
          mode="edit"
          flipbook={{
            id: flipbook.id,
            name: flipbook.name,
            status: flipbook.is_published ? "published" : "unpublished",
            pdf_url: flipbook.pdf_url,
            background_image_url: flipbook.background_image_url,
            cover_image_url: flipbook.cover_image_url,
          }}
          onSuccess={() => router.replace("/manage-flipbooks")}
          onCancel={() => router.push("/manage-flipbooks")}
        />
      )}
    </main>
  );
}
