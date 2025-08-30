"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, X, Loader2 } from "lucide-react";
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
}

export function EditFlipbookForm({ flipbook, onSuccess, onCancel }: EditFlipbookFormProps) {
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

  const FileUpload = ({
    label,
    accept,
    file,
    onChange,
    error,
  }: {
    label: string;
    accept: string;
    file: File | null;
    onChange: (f: File | null) => void;
    error?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {file ? (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
          </div>
          <Button type="button" variant="ghost" size="sm" className="cursor-pointer" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-3 text-center h-15 mx-auto flex flex-col items-center justify-center">
          <Upload className="mx-auto h-5 w-3 text-muted-foreground" />
          <div className="mt-1.5">
            <Label htmlFor={`${label.toLowerCase()}-upload`} className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
              Click to upload {label.toLowerCase()}
            </Label>
            <Input id={`${label.toLowerCase()}-upload`} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {accept.includes('pdf') ? 'PDF files only' : 'PNG, JPG, GIF up to 10MB'}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm">Flipbook Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter flipbook name" className={`${errors.name ? 'border-destructive' : ''} h-9 text-sm`} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <FileUpload label="Replace PDF" accept=".pdf" file={pdfFile} onChange={setPdfFile} error={errors.pdf} />
        <FileUpload label="Replace Background (Optional)" accept="image/*" file={backgroundFile} onChange={setBackgroundFile} error={errors.background} />

        <div className="flex items-center space-x-2">
          <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
          <Label htmlFor="publish" className="text-sm">Published</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-1.5">
          <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={onCancel} disabled={updateFlipbook.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="cursor-pointer" disabled={updateFlipbook.isPending}>
            {updateFlipbook.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditFlipbookForm;
