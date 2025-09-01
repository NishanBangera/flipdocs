"use client";

import { useRouter } from "next/navigation";
import { CreateFlipbookForm } from "../../components/forms/create-flipbook-form";

export default function CreateFlipbookPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Create Flipbook</h1>
          <p className="text-sm opacity-80">Upload a PDF and optional background, then publish.</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <CreateFlipbookForm
          onSuccess={() => router.replace("/manage-flipbooks")}
          onCancel={() => router.push("/manage-flipbooks")}
        />
      </div>
    </div>
  );
}
