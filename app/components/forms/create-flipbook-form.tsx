"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useCreateFlipbook } from "@/lib/hooks/use-flipbooks";
import { CreateFlipbookData } from "@/lib/types";

interface CreateFlipbookFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateFlipbookForm({ onSuccess, onCancel }: CreateFlipbookFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublished: false,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createFlipbook = useCreateFlipbook();

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Flipbook name is required";
    }

    if (!pdfFile) {
      newErrors.pdf = "PDF file is required";
    } else if (pdfFile.type !== "application/pdf") {
      newErrors.pdf = "File must be a PDF";
    }

    if (backgroundFile && !backgroundFile.type.startsWith("image/")) {
      newErrors.background = "Background file must be an image";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const createData: CreateFlipbookData = {
      name: formData.name.trim(),
      pdf: pdfFile!,
      backgroundImage: backgroundFile || undefined,
      isPublished: formData.isPublished,
    };
    console.log("Flipbook Published:", formData.isPublished, typeof formData.isPublished);

    try {
      console.log("checkkkkkkkkkkk")
      await createFlipbook.mutateAsync(createData);
      console.log("Flipbook created successfully");
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error creating flipbook:", error);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'pdf' | 'background'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileType === 'pdf') {
      setPdfFile(file);
      setErrors(prev => ({ ...prev, pdf: '' }));
    } else {
      setBackgroundFile(file);
      setErrors(prev => ({ ...prev, background: '' }));
    }
  };

  const removeFile = (fileType: 'pdf' | 'background') => {
    if (fileType === 'pdf') {
      setPdfFile(null);
    } else {
      setBackgroundFile(null);
    }
  };

  const FileUploadSection = ({ 
    label, 
    file, 
    accept, 
    error, 
    onChange, 
    onRemove 
  }: {
    label: string;
    file: File | null;
    accept: string;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {file ? (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({Math.round(file.size / 1024)} KB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
      size="sm"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
  <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-3 text-center h-15 mx-auto flex flex-col items-center justify-center">
          <Upload className="mx-auto h-5 w-3 text-muted-foreground" />
          <div className="mt-1.5">
            <Label
              htmlFor={`${label.toLowerCase()}-upload`}
              className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
            >
              Click to upload {label.toLowerCase()}
            </Label>
            <Input
              id={`${label.toLowerCase()}-upload`}
              type="file"
              accept={accept}
              onChange={onChange}
              className="hidden"
            />
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
          {/* Flipbook Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Flipbook Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter flipbook name"
        className={`${errors.name ? "border-destructive" : ""} h-9 text-sm`}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* PDF Upload */}
          <FileUploadSection
            label="PDF File"
            file={pdfFile}
            accept=".pdf"
            error={errors.pdf}
            onChange={(e) => handleFileChange(e, 'pdf')}
            onRemove={() => removeFile('pdf')}
          />

          {/* Background Image Upload */}
          <FileUploadSection
            label="Background Image (Optional)"
            file={backgroundFile}
            accept="image/*"
            error={errors.background}
            onChange={(e) => handleFileChange(e, 'background')}
            onRemove={() => removeFile('background')}
          />

          {/* Publish Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="publish"
              checked={formData.isPublished}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isPublished: checked }))}
            />
            <Label htmlFor="publish" className="text-sm">Publish immediately</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={createFlipbook.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createFlipbook.isPending}
            >
              {createFlipbook.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Flipbook"
              )}
            </Button>
          </div>
  </form>
  </div>
  );
}