"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "../file-dropzone";
import { BookOpen, Loader2, FileText } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUpdateFlipbook } from "@/lib/hooks/use-flipbooks";
import type { UpdateFlipbookData } from "@/lib/types";

export interface EditFlipbookFormProps {
  flipbook: {
    id: string;
    name: string;
    status: "published" | "unpublished";
    pdf_url: string;
    background_image_url?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  // Optional callbacks to sync preview in a wrapper screen
  onNameChange?: (name: string) => void;
  onPdfFileChange?: (file: File | null) => void;
  onBackgroundFileChange?: (file: File | null) => void;
  onIsPublishedChange?: (v: boolean) => void;
}

export function EditFlipbookForm({ flipbook, onSuccess, onCancel, onNameChange, onPdfFileChange, onBackgroundFileChange, onIsPublishedChange }: EditFlipbookFormProps) {
  const [name, setName] = useState(flipbook.name);
  const [isPublished, setIsPublished] = useState(flipbook.status === "published");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFlipbook = useUpdateFlipbook();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Flipbook name is required";
    if (pdfFile && pdfFile.type !== "application/pdf") errs.pdf = "File must be a PDF";
    if (backgroundFile && !backgroundFile.type.startsWith("image/")) errs.background = "Background must be an image";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: UpdateFlipbookData = {};
    if (name.trim() && name.trim() !== flipbook.name) data.name = name.trim();
    if (pdfFile) data.pdf = pdfFile;
    if (backgroundFile) data.backgroundImage = backgroundFile;
    data.isPublished = isPublished;

    try {
      await updateFlipbook.mutateAsync({ id: flipbook.id, data });
      onSuccess?.();
    } catch {
      // handled in hook
    }
  };

  const isReady = name.trim().length > 0;

  const getFileNameFromUrl = (url?: string) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const last = u.pathname.split("/").pop() || url;
      return decodeURIComponent(last);
    } catch {
      const last = url.split("/").pop() || url;
      return decodeURIComponent(last);
    }
  };

  return (
    <Card className="border-muted/40">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-black">
            <BookOpen className="h-4 w-4" />
          </div>
          <CardTitle className="text-lg">Flipbook details</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Keep names short and descriptive. PDF must be the final export.</p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="flipbook-name">Flipbook name</Label>
            <Input
              id="flipbook-name"
              placeholder="e.g. Autumn Catalog 2025"
              value={name}
              onChange={(e) => { setName(e.target.value); onNameChange?.(e.target.value); }}
              className={errors.name ? "border-destructive" : ""}
              disabled={updateFlipbook.isPending}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            {/* Show current PDF when no replacement chosen */}
            {!pdfFile && flipbook.pdf_url ? (
              <div className="flex items-center justify-between rounded-md bg-muted p-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{getFileNameFromUrl(flipbook.pdf_url)}</span>
                </div>
                <a
                  href={flipbook.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-muted-foreground"
                >
                  View
                </a>
              </div>
            ) : null}
            <FileDropzone
              id="flipbook-pdf"
              label="PDF file"
              description="PDF only"
              accept="application/pdf"
              value={pdfFile}
              onChange={(f) => { setPdfFile(f); onPdfFileChange?.(f); }}
              maxSizeMB={100}
            />
            {errors.pdf && <p className="text-xs text-destructive">{errors.pdf}</p>}
          </div>

          <div className="space-y-1">
            {/* Show current background thumbnail when no replacement chosen */}
            {!backgroundFile && flipbook.background_image_url ? (
              <div className="flex items-center justify-between rounded-md bg-muted p-2">
                <div className="flex items-center gap-2">
                  <Image
                    src={flipbook.background_image_url}
                    alt="Current background"
                    width={64}
                    height={40}
                    unoptimized
                    className="h-10 w-16 rounded border object-cover"
                  />
                  <span className="text-sm font-medium">Current background</span>
                </div>
                <a
                  href={flipbook.background_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-muted-foreground"
                >
                  View
                </a>
              </div>
            ) : null}
            <FileDropzone
              id="flipbook-bg"
              label="Background image (optional)"
              description="PNG, JPG, or GIF up to 10MB"
              accept="image/png,image/jpeg,image/gif"
              value={backgroundFile}
              onChange={(f) => { setBackgroundFile(f); onBackgroundFileChange?.(f); }}
              maxSizeMB={10}
            />
            {errors.background && <p className="text-xs text-destructive">{errors.background}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
            <div>
              <Label htmlFor="publish-now" className="mb-0 block">
                Publish immediately
              </Label>
              <p className="text-xs text-muted-foreground">If off, you can publish later from Manage Flipbooks.</p>
            </div>
            <Switch
              id="publish-now"
              checked={isPublished}
              onCheckedChange={(v) => { setIsPublished(v); onIsPublishedChange?.(v); }}
              aria-label="Publish immediately"
              disabled={updateFlipbook.isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={updateFlipbook.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateFlipbook.isPending || !isReady}
            className={cn("bg-emerald-500 text-black hover:bg-emerald-400", (!isReady || updateFlipbook.isPending) && "pointer-events-none opacity-60")}
          >
            {updateFlipbook.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default EditFlipbookForm;
