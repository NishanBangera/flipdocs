"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle } from "lucide-react"
import { FlipbookForm } from "./flipbook-form"
import { useRouter } from "next/navigation"

export interface FlipbookFormScreenProps {
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
  
  // Navigation callbacks
  onSuccess?: () => void
  onCancel?: () => void
  
  // Optional additional content in preview section
  previewContent?: React.ReactNode
}

export function FlipbookFormScreen({
  mode,
  flipbook,
  onSuccess,
  onCancel,
  previewContent,
}: FlipbookFormScreenProps) {
  const router = useRouter()
  
  // State for preview sync and form data
  const [name, setName] = React.useState(mode === "edit" ? flipbook?.name || "" : "")
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = React.useState<File | null>(null)
  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [isPublished, setIsPublished] = React.useState(
    mode === "edit" ? flipbook?.status === "published" : true
  )
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null)

  // Handle PDF preview URL - prefer new file over existing URL
  React.useEffect(() => {
    if (pdfFile && pdfFile.type === "application/pdf") {
      const url = URL.createObjectURL(pdfFile)
      setPdfUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPdfUrl(mode === "edit" ? flipbook?.pdf_url || null : null)
    return
  }, [pdfFile, mode, flipbook?.pdf_url])

  // Determine PDF label for badge
  const currentPdfLabel = React.useMemo(() => {
    if (pdfFile) return pdfFile.name
    if (mode === "edit" && flipbook?.pdf_url) {
      try {
        const u = new URL(flipbook.pdf_url)
        return decodeURIComponent(u.pathname.split("/").pop() || "Existing PDF")
      } catch {
        return "Existing PDF"
      }
    }
    return "No PDF selected"
  }, [pdfFile, mode, flipbook?.pdf_url])

  // Default success handler
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      // Default navigation behavior
      router.push('/manage-flipbooks')
    }
  }

  // Default cancel handler
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      // Default navigation behavior
      router.back()
    }
  }

  return (
    <div className="h-full grid gap-6 md:grid-cols-5">
      {/* Form Section */}
      <div className="h-full md:col-span-3">
        <FlipbookForm
          mode={mode}
          flipbook={flipbook}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onNameChange={setName}
          onPdfFileChange={setPdfFile}
          onBackgroundFileChange={setBackgroundFile}
          onCoverFileChange={setCoverFile}
          onIsPublishedChange={setIsPublished}
        />
      </div>

      {/* Preview Section */}
      <aside className="h-full md:col-span-2">
        <Card className="sticky top-6 flex flex-col h-full border-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full space-y-4">
            <div className="flex flex-col h-full relative overflow-hidden rounded-lg border bg-secondary/20">
              <div className="flex-grow h-0 aspect-[3/4] w-full relative">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="Flipbook PDF preview"
                    className="absolute inset-0 h-full w-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                      <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-muted-foreground">No PDF uploaded</p>
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-background/70 p-3">
                <p className="line-clamp-2 text-sm font-medium">
                  {name || (mode === "edit" ? flipbook?.name : "Your flipbook name")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {currentPdfLabel}
                  </Badge>
                  <Badge variant="outline">
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Optional additional preview content */}
            {previewContent}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}