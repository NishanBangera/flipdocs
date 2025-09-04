"use client"

import { useState, useMemo } from "react"
import { Button } from "../../../components/ui/button"
import { Label } from "../../../components/ui/label"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { FileDropzone } from "../file-dropzone"
import { BookOpen, Loader2, RefreshCw } from "lucide-react"
import { cn } from "../../../lib/utils"
import { useCreateFlipbook, useUpdateFlipbook } from "../../../lib/hooks/use-flipbooks"
import { useMediaQuery } from "../../../hooks/use-media-query"
import { useSlugValidation } from "../../../hooks/use-slug-validation"
import { isValidSlugFormat, getFileNameFromUrl } from "../../../lib/utils/slug"
import { usePublish } from "../providers/publish.provider"
import type { CreateFlipbookData, UpdateFlipbookData } from "../../../lib/types"

export interface FlipbookFormProps {
  mode: "create" | "edit"
  flipbook?: {
    id: string
    name: string
    slug: string
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
  onSlugChange?: (slug: string) => void
  onPdfFileChange?: (file: File | null) => void
  onBackgroundFileChange?: (file: File | null) => void
  onCoverFileChange?: (file: File | null) => void
}

export function FlipbookForm({
  mode,
  flipbook,
  onSuccess,
  onCancel,
  onNameChange,
  onSlugChange,
  onPdfFileChange,
  onBackgroundFileChange,
  onCoverFileChange,
}: FlipbookFormProps) {
  const isXs = useMediaQuery("(max-width: 424px)")
  const publishCtx = usePublish()

  // Form state
  const [name, setName] = useState(mode === "edit" ? flipbook?.name || "" : "")
  const [slug, setSlug] = useState(mode === "edit" ? flipbook?.slug || "" : "")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Hooks
  const createFlipbook = useCreateFlipbook()
  const updateFlipbook = useUpdateFlipbook()
  const slugValidation = useSlugValidation({
    mode,
    flipbookId: flipbook?.id,
    originalSlug: flipbook?.slug
  })

  const isPending = createFlipbook.isPending || updateFlipbook.isPending

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Flipbook name is required"
    }

    if (!slug.trim()) {
      newErrors.slug = "Slug is required"
    } else if (!isValidSlugFormat(slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens"
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
          slug: slug.trim(),
          pdf: pdfFile!,
          backgroundImage: backgroundFile || undefined,
          coverImage: coverFile || undefined,
      isPublished: publishCtx.createIsPublished,
        }
        await createFlipbook.mutateAsync(createData)
      } else {
        // Edit mode - always include slug if it has changed
        const updateData: UpdateFlipbookData = {}
        if (name.trim() && name.trim() !== flipbook?.name) {
          updateData.name = name.trim()
        }
        if (slug.trim() && slug.trim() !== flipbook?.slug) {
          updateData.slug = slug.trim()
        }
        if (pdfFile) updateData.pdf = pdfFile
        if (backgroundFile) updateData.backgroundImage = backgroundFile
  if (coverFile) updateData.coverImage = coverFile

        await updateFlipbook.mutateAsync({ id: flipbook!.id, data: updateData })
      }

      onSuccess?.()
    } catch (error) {
      // Error handling is done in the hooks
      console.error(`Error ${mode === "create" ? "creating" : "updating"} flipbook:`, error)
    }
  }

  // Event handlers
  const handleNameChange = (value: string) => {
    setName(value)
    onNameChange?.(value)
  }

  const handleSlugChange = (value: string) => {
    const newSlug = slugValidation.handleSlugChange(value, onSlugChange)
    setSlug(newSlug)
  }

  const handleSlugBlur = () => {
    slugValidation.handleSlugBlur(slug)
  }

  const handleGenerateSlug = async () => {
    const newSlug = await slugValidation.generateFromName(name, onSlugChange)
    if (newSlug) {
      setSlug(newSlug)
    }
  }

  const handleUseSuggestion = () => {
    slugValidation.useSuggestion((newSlug) => {
      setSlug(newSlug)
      onSlugChange?.(newSlug)
    })
  }

  // File handlers
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

  // Computed values
  const hasChanges = useMemo(() => {
    if (mode === "create") return true

    const nameChanged = name.trim() !== (flipbook?.name || "")
    const slugChanged = slug.trim() !== (flipbook?.slug || "")
    const hasNewFiles = pdfFile !== null || backgroundFile !== null || coverFile !== null

    return nameChanged || slugChanged || hasNewFiles
  }, [mode, name, slug, pdfFile, backgroundFile, coverFile, flipbook])

  const isReady = name.trim().length > 0 &&
    slug.trim().length > 0 &&
    slugValidation.validation.isValid &&
    (mode === "edit" || pdfFile !== null) &&
    hasChanges

  const submitButtonText = mode === "create"
    ? (isPending ? "Creating..." : "Create flipbook")
    : (isPending ? "Saving..." : "Save changes")

  const pdfAttachmentLabel = mode === "edit" && !isXs
    ? getFileNameFromUrl(flipbook?.pdf_url)
    : undefined

  return (
    <Card className="border-muted/40 h-full max-w-full">
      <CardHeader className="space-y-1 px-3 sm:px-5 md:px-6 py-0 max-[424px]:px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-emerald-500 text-black">
            <BookOpen className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm sm:text-base md:text-lg">Flipbook details</CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between">
        <CardContent className="space-y-3 sm:space-y-5 md:space-y-6 max-[424px]:space-y-2 p-3 sm:px-5 py-0 max-[424px]:p-2 min-w-0">
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

          {/* Slug Field */}
          <div className="space-y-2">
            <Label htmlFor="flipbook-slug" className="text-xs sm:text-sm md:text-base">URL slug</Label>
            <div className="flex gap-2">
              <Input
                ref={slugValidation.inputRef}
                id="flipbook-slug"
                placeholder="e.g. autumn-catalog-2025"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                className={cn(
                  errors.slug && "border-destructive",
                  !slugValidation.validation.isValid && slug.trim() && "border-destructive",
                  "text-sm sm:text-base h-9 sm:h-10 flex-1"
                )}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSlug}
                disabled={isPending || !name.trim() || slugValidation.validation.isValidating}
                className="h-9 sm:h-10 px-3 flex-shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", slugValidation.validation.isValidating && "animate-spin")} />
                <span className="ml-1 hidden sm:inline">Auto</span>
              </Button>
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            {slugValidation.validation.message && (
              <div className={cn(
                "text-xs flex items-center gap-1",
                slugValidation.validation.isValid ? "text-emerald-600" : "text-destructive"
              )}>
                {slugValidation.validation.isValidating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </>
                ) : (
                  <>
                    {slugValidation.validation.message}
                    {!slugValidation.validation.isValid && slugValidation.validation.suggestedSlug && (
                      <button
                        type="button"
                        onClick={handleUseSuggestion}
                        className="underline hover:no-underline ml-1"
                      >
                        Use suggestion
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This will be your flipbook&apos;s public URL: /view/{slug || 'your-slug'}
            </p>
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
              description="PNG, JPG, or GIF up to 50MB"
              accept="image/png,image/jpeg,image/gif"
              value={backgroundFile}
              onChange={handleBackgroundFileChange}
              maxSizeMB={50}
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
          {/* Publish toggle moved to header */}
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
              (!isReady || isPending) && "opacity-60 hover:cursor-not-allowed"
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