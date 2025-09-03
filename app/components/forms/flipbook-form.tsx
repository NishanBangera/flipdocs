"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDropzone } from "../file-dropzone"
import { BookOpen, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateFlipbook, useUpdateFlipbook } from "@/lib/hooks/use-flipbooks"
import { useFlipbookApi } from "@/lib/api"
import type { CreateFlipbookData, UpdateFlipbookData } from "@/lib/types"

export interface FlipbookFormProps {
  // Mode and data
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
  onIsPublishedChange?: (isPublished: boolean) => void
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
  const [slug, setSlug] = useState(mode === "edit" ? flipbook?.slug || "" : "")
  const [slugValidation, setSlugValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    message: string;
    suggestedSlug?: string;
  }>({ isValidating: false, isValid: true, message: "" })
  const [isPublished, setIsPublished] = useState(
    mode === "edit" ? flipbook?.status === "published" : true
  )

  const flipbookApi = useFlipbookApi()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasUserModifiedSlug, setHasUserModifiedSlug] = useState(false)

  const createFlipbook = useCreateFlipbook()
  const updateFlipbook = useUpdateFlipbook()

  const isPending = createFlipbook.isPending || updateFlipbook.isPending

  // Debouncing timer ref
  const slugValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const slugInputRef = useRef<HTMLInputElement>(null)

  // Slug validation function - optimized to prevent unnecessary re-renders
  const validateSlug = useCallback(async (slugToValidate: string) => {
    if (!slugToValidate.trim()) {
      setSlugValidation({ isValidating: false, isValid: true, message: "" })
      return
    }

    // Preserve focus by storing current active element
    const activeElement = document.activeElement

    // Only update isValidating if it's not already true to prevent re-renders
    setSlugValidation(prev => {
      if (prev.isValidating) return prev
      return { ...prev, isValidating: true }
    })

    try {
      const result = await flipbookApi.validateSlug(
        slugToValidate,
        mode === "edit" ? flipbook?.id : undefined
      )

      // Batch the state update to prevent multiple re-renders
      const newState = result.available ? {
        isValidating: false,
        isValid: true,
        message: "Slug is available"
      } : {
        isValidating: false,
        isValid: false,
        message: `Slug is already taken. Suggested: ${result.suggestedSlug}`,
        suggestedSlug: result.suggestedSlug
      }

      setSlugValidation(newState)

      // Restore focus if it was lost
      if (activeElement === slugInputRef.current && document.activeElement !== slugInputRef.current) {
        setTimeout(() => slugInputRef.current?.focus(), 0)
      }

    } catch (_error) {
      setSlugValidation({
        isValidating: false,
        isValid: false,
        message: "Error validating slug"
      })

      // Restore focus if it was lost
      if (activeElement === slugInputRef.current && document.activeElement !== slugInputRef.current) {
        setTimeout(() => slugInputRef.current?.focus(), 0)
      }
    }
  }, [flipbookApi, mode, flipbook?.id])

  // Debounced slug validation effect - only run if user has modified slug or in create mode
  useEffect(() => {
    if (slugValidationTimeoutRef.current) {
      clearTimeout(slugValidationTimeoutRef.current)
    }

    const currentSlug = slug.trim()
    const originalSlug = mode === "edit" ? flipbook?.slug || "" : ""
    
    // If in edit mode and slug matches original, show "Current slug" without API call
    if (mode === "edit" && currentSlug === originalSlug && currentSlug) {
      setSlugValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
      return
    }

    // Only validate if:
    // 1. User has modified the slug (for edit mode) AND slug is different from original
    // 2. Or we're in create mode
    if (currentSlug && ((hasUserModifiedSlug && mode === "edit" && currentSlug !== originalSlug) || mode === "create")) {
      slugValidationTimeoutRef.current = setTimeout(() => {
        validateSlug(currentSlug)
      }, 500)
    } else if (!currentSlug) {
      setSlugValidation({ isValidating: false, isValid: true, message: "" })
    }

    // Cleanup on unmount
    return () => {
      if (slugValidationTimeoutRef.current) {
        clearTimeout(slugValidationTimeoutRef.current)
      }
    }
  }, [slug, validateSlug, hasUserModifiedSlug, mode, flipbook?.slug])

  // Auto-generate slug from name
  const generateSlugFromName = async () => {
    if (!name.trim()) return

    // Simple slug generation on frontend
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check availability and get suggestion if taken
    try {
      const result = await flipbookApi.validateSlug(
        baseSlug,
        mode === "edit" ? flipbook?.id : undefined
      )

      // Use the suggested slug (which will be the original if available, or an alternative)
      const finalSlug = result.suggestedSlug || baseSlug
      setSlug(finalSlug)
      onSlugChange?.(finalSlug)
      // Mark as user modified since they clicked the auto-generate button
      setHasUserModifiedSlug(true)

      // Set validation state
      setSlugValidation({
        isValidating: false,
        isValid: result.available || !!result.suggestedSlug,
        message: result.available
          ? "Slug is available"
          : result.suggestedSlug
            ? `Original slug taken, using: ${result.suggestedSlug}`
            : "Slug is taken",
        suggestedSlug: result.suggestedSlug
      })

    } catch (_error) {
      // Fallback: just set the base slug and let normal validation handle it
      setSlug(baseSlug)
      onSlugChange?.(baseSlug)
      // Mark as user modified since they clicked the auto-generate button
      setHasUserModifiedSlug(true)
      setSlugValidation({
        isValidating: false,
        isValid: false,
        message: "Error generating slug, please check manually"
      })
    }
  }

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Flipbook name is required"
    }

    if (!slug.trim()) {
      newErrors.slug = "Slug is required"
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
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
          isPublished,
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

  const handleSlugChange = useCallback((value: string) => {
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitizedSlug)
    onSlugChange?.(sanitizedSlug)
    // Mark that user has modified the slug
    if (!hasUserModifiedSlug) {
      setHasUserModifiedSlug(true)
    }
    // Validation will be handled by the useEffect hook with debouncing
  }, [onSlugChange, hasUserModifiedSlug])

  // Handle blur to show current slug message for unchanged values (no API call)
  const handleSlugBlur = useCallback(() => {
    const currentSlug = slug.trim()
    const originalSlug = mode === "edit" ? flipbook?.slug || "" : ""
    
    // If in edit mode and slug matches original, show "Current slug" without API call
    if (mode === "edit" && currentSlug === originalSlug && currentSlug) {
      setSlugValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
    }
    
    // No API calls on blur - validation only happens through debounced input changes
  }, [slug, mode, flipbook?.slug])

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

  // Check if form has changes in edit mode
  const hasChanges = useMemo(() => {
    if (mode === "create") return true // Always allow creation

    // Check if any field has changed from original values
    const nameChanged = name.trim() !== (flipbook?.name || "")
    const slugChanged = slug.trim() !== (flipbook?.slug || "")
    const statusChanged = isPublished !== (flipbook?.status === "published")
    const hasNewFiles = pdfFile !== null || backgroundFile !== null || coverFile !== null

    return nameChanged || slugChanged || statusChanged || hasNewFiles
  }, [mode, name, slug, isPublished, pdfFile, backgroundFile, coverFile, flipbook])
  // Check if form is ready for submission
  const isReady = name.trim().length > 0 &&
    slug.trim().length > 0 &&
    slugValidation.isValid &&
    (mode === "edit" || pdfFile !== null) &&
    hasChanges // Only allow submission if there are changes (or in create mode)

  // Initialize slug validation for edit mode
  useEffect(() => {
    if (mode === "edit" && flipbook?.slug && slug === flipbook.slug) {
      // For edit mode, set initial validation state for existing slug
      setSlugValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
    }
  }, [mode, flipbook?.slug, slug])

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
                ref={slugInputRef}
                id="flipbook-slug"
                placeholder="e.g. autumn-catalog-2025"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                className={cn(
                  errors.slug && "border-destructive",
                  !slugValidation.isValid && slug.trim() && "border-destructive",
                  "text-sm sm:text-base h-9 sm:h-10 flex-1"
                )}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSlugFromName}
                disabled={isPending || !name.trim() || slugValidation.isValidating}
                className="h-9 sm:h-10 px-3 flex-shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", slugValidation.isValidating && "animate-spin")} />
                <span className="ml-1 hidden sm:inline">Auto</span>
              </Button>
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            {slugValidation.message && (
              <div className={cn(
                "text-xs flex items-center gap-1",
                slugValidation.isValid ? "text-emerald-600" : "text-destructive"
              )}>
                {slugValidation.isValidating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </>
                ) : (
                  <>
                    {slugValidation.message}
                    {!slugValidation.isValid && slugValidation.suggestedSlug && (
                      <button
                        type="button"
                        onClick={() => {
                          const suggestedSlug = slugValidation.suggestedSlug!
                          setSlug(suggestedSlug)
                          onSlugChange?.(suggestedSlug)
                          setHasUserModifiedSlug(true)
                          
                          // Check if suggested slug is same as original
                          const originalSlug = mode === "edit" ? flipbook?.slug || "" : ""
                          if (mode === "edit" && suggestedSlug === originalSlug) {
                            setSlugValidation({
                              isValidating: false,
                              isValid: true,
                              message: "Current slug"
                            })
                          } else {
                            validateSlug(suggestedSlug)
                          }
                        }}
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