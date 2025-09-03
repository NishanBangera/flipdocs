"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDropzone } from "../file-dropzone"
import { BookOpen, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateFlipbook, useUpdateFlipbook } from "@/lib/hooks/use-flipbooks"
import type { CreateFlipbookData, UpdateFlipbookData } from "@/lib/types"

export interface FlipbookFormProps {
  // Mode and data
  mode: "create" | "edit"
  flipbook?: {
    id: string
    name: string
    status: "published" | "unpublished"
    pdf_url: string
    background_image_url?: string
    cover_image_url?: string
  }
  
  // Callbacks
  onSuccess?: () => void
  onCancel?: () => void
  
  // Preview sync callbacks (for external preview components)
  onNameChange?: (name: string) => void
  onPdfFileChange?: (file: File | null) => void
  onBackgroundFileChange?: (file: File | null) => void
  onCoverFileChange?: (file: File | null) => void
  onIsPublishedChange?: (isPublished: boolean) => void
}

export function FlipbookForm({
  mode,
  flipbook,
  onSuccess,
  onCancel,
  onNameChange,
  onPdfFileChange,
  onBackgroundFileChange,
  onCoverFileChange,
  onIsPublishedChange,
}: FlipbookFormProps) {
  // Local media query hook for very small screens
  const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false)
    useEffect(() => {
      const mql = window.matchMedia(query)
      const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
      setMatches(mql.matches)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }, [query])
    return matches
  }

  const isXs = useMediaQuery("(max-width: 424px)")
  // Initialize form state based on mode
  const [name, setName] = useState(mode === "edit" ? flipbook?.name || "" : "")
  const [isPublished, setIsPublished] = useState(
    mode === "edit" ? flipbook?.status === "published" : true
  )
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createFlipbook = useCreateFlipbook()
  const updateFlipbook = useUpdateFlipbook()

  const isPending = createFlipbook.isPending || updateFlipbook.isPending

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Flipbook name is required"
    }

    // For create mode, PDF is required
    if (mode === "create" && !pdfFile) {
      newErrors.pdf = "PDF file is required"
    }

    if (pdfFile && pdfFile.type !== "application/pdf") {
      newErrors.pdf = "File must be a PDF"
    }

    if (backgroundFile && !backgroundFile.type.startsWith("image/")) {
      newErrors.background = "Background file must be an image"
    }

    if (coverFile && !coverFile.type.startsWith("image/")) {
      newErrors.cover = "Cover file must be an image"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      if (mode === "create") {
        const createData: CreateFlipbookData = {
          name: name.trim(),
          pdf: pdfFile!,
          backgroundImage: backgroundFile || undefined,
          coverImage: coverFile || undefined,
          isPublished,
        }
        await createFlipbook.mutateAsync(createData)
      } else {
        // Edit mode
        const updateData: UpdateFlipbookData = {}
        if (name.trim() && name.trim() !== flipbook?.name) {
          updateData.name = name.trim()
        }
        if (pdfFile) updateData.pdf = pdfFile
        if (backgroundFile) updateData.backgroundImage = backgroundFile
        if (coverFile) updateData.coverImage = coverFile
        updateData.isPublished = isPublished

        await updateFlipbook.mutateAsync({ id: flipbook!.id, data: updateData })
      }
      
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the hooks
      console.error(`Error ${mode === "create" ? "creating" : "updating"} flipbook:`, error)
    }
  }

  // Handle field changes with preview sync
  const handleNameChange = (value: string) => {
    setName(value)
    onNameChange?.(value)
  }

  const handlePdfFileChange = (file: File | null) => {
    setPdfFile(file)
    onPdfFileChange?.(file)
  }

  const handleBackgroundFileChange = (file: File | null) => {
    setBackgroundFile(file)
    onBackgroundFileChange?.(file)
  }

  const handleCoverFileChange = (file: File | null) => {
    setCoverFile(file)
    onCoverFileChange?.(file)
  }

  const handleIsPublishedChange = (value: boolean) => {
    setIsPublished(value)
    onIsPublishedChange?.(value)
  }

  // Check if form is ready for submission
  const isReady = name.trim().length > 0 && (mode === "edit" || pdfFile !== null)

  // Helper to get filename from URL
  const getFileNameFromUrl = (url?: string) => {
    if (!url) return ""
    try {
      const u = new URL(url)
      const last = u.pathname.split("/").pop() || url
      return decodeURIComponent(last)
    } catch {
      const last = url.split("/").pop() || url
      return decodeURIComponent(last)
    }
  }

  const submitButtonText = mode === "create" 
    ? (isPending ? "Creating..." : "Create flipbook")
    : (isPending ? "Saving..." : "Save changes")

  const pdfAttachmentLabel = mode === "edit" && !isXs
    ? getFileNameFromUrl(flipbook?.pdf_url)
    : undefined

  return (
    <Card className="border-muted/40 h-full max-w-full">
      <CardHeader className="space-y-1 p-3 sm:p-5 md:p-6 max-[424px]:p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-emerald-500 text-black">
            <BookOpen className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm sm:text-base md:text-lg">Flipbook details</CardTitle>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Keep names short and descriptive. PDF must be the final export.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between">
  <CardContent className="space-y-3 sm:space-y-5 md:space-y-6 max-[424px]:space-y-2 p-3 sm:p-5 md:p-6 max-[424px]:p-2 min-w-0">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="flipbook-name" className="text-xs sm:text-sm md:text-base">Flipbook name</Label>
            <Input
              id="flipbook-name"
              placeholder="e.g. Autumn Catalog 2025"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={cn(errors.name && "border-destructive", "text-sm sm:text-base h-9 sm:h-10")}
              disabled={isPending}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* PDF File Field */}
          <div className="space-y-1">
            <FileDropzone
              id="flipbook-pdf"
              label="PDF file"
              mode={mode}
              attachmentLabel={pdfAttachmentLabel}
              attachmentUrl={flipbook?.pdf_url}
              description="PDF only"
              accept="application/pdf"
              value={pdfFile}
              onChange={handlePdfFileChange}
              maxSizeMB={100}
            />
            {errors.pdf && <p className="text-xs text-destructive">{errors.pdf}</p>}
          </div>

          {/* Background Image Field */}
          <div className="space-y-1">
            <FileDropzone
              id="flipbook-bg"
              label="Background image (optional)"
              mode={mode}
              attachmentLabel="Current background"
              attachmentUrl={flipbook?.background_image_url}
              description="PNG, JPG, or GIF up to 10MB"
              accept="image/png,image/jpeg,image/gif"
              value={backgroundFile}
              onChange={handleBackgroundFileChange}
              maxSizeMB={10}
            />
            {errors.background && <p className="text-xs text-destructive">{errors.background}</p>}
          </div>

          {/* Cover Image Field */}
          <div className="space-y-1">
            <FileDropzone
              id="flipbook-cover"
              label="Cover image (optional)"
              mode={mode}
              attachmentLabel="Current cover"
              attachmentUrl={flipbook?.cover_image_url}
              description="PNG, JPG, or GIF up to 10MB"
              accept="image/png,image/jpeg,image/gif"
              value={coverFile}
              onChange={handleCoverFileChange}
              maxSizeMB={10}
            />
            {errors.cover && <p className="text-xs text-destructive">{errors.cover}</p>}
          </div>

          {/* Publish Switch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 rounded-lg border bg-secondary/30 p-3 sm:p-4 max-[424px]:p-2">
            <div className="min-w-0">
              <Label htmlFor="publish-now" className="mb-0 block text-sm sm:text-base">
                Publish immediately
              </Label>
              <p className="text-xs text-muted-foreground">
                If off, you can publish later from Manage Flipbooks.
              </p>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto">
              <Switch
                id="publish-now"
                checked={isPublished}
                onCheckedChange={handleIsPublishedChange}
                aria-label="Publish immediately"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>

  <CardFooter className="w-full min-w-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-3 sm:mt-5 p-3 sm:p-5 md:p-6 max-[424px]:p-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            className="text-sm sm:text-base w-full sm:w-auto"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !isReady}
            className={cn(
              "bg-emerald-500 text-black hover:bg-emerald-400",
              "text-sm sm:text-base w-full sm:w-auto",
              (!isReady || isPending) && "pointer-events-none opacity-60"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitButtonText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}