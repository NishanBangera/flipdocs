"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle } from "lucide-react"
import type { EditFlipbookFormProps } from "./edit-flipbook-form"
import { EditFlipbookForm } from "./edit-flipbook-form"

type Props = EditFlipbookFormProps

export function EditFlipbookScreen({ flipbook, onSuccess, onCancel }: Props) {
  const [name, setName] = React.useState(flipbook.name)
  const [isPublished, setIsPublished] = React.useState(flipbook.status === "published")
  const [selectedPdf, setSelectedPdf] = React.useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null)

  // Prefer preview of newly selected file; else fall back to existing URL
  React.useEffect(() => {
    if (selectedPdf && selectedPdf.type === "application/pdf") {
      const url = URL.createObjectURL(selectedPdf)
      setPdfUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPdfUrl(flipbook.pdf_url || null)
    return
  }, [selectedPdf, flipbook.pdf_url])

  // Derive a readable label for current file when not replaced
  const currentPdfLabel = React.useMemo(() => {
    if (selectedPdf) return selectedPdf.name
    try {
      const u = new URL(flipbook.pdf_url)
      return decodeURIComponent(u.pathname.split("/").pop() || "Existing PDF")
    } catch {
      return "Existing PDF"
    }
  }, [selectedPdf, flipbook.pdf_url])

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <EditFlipbookForm
          flipbook={flipbook}
          onSuccess={onSuccess}
          onCancel={onCancel}
          onNameChange={setName}
          onPdfFileChange={setSelectedPdf}
          onIsPublishedChange={setIsPublished}
        />
      </div>

      <aside className="md:col-span-2">
        <Card className="sticky top-6 border-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border bg-secondary/20">
              <div className="aspect-[3/4] w-full relative">
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
                <p className="line-clamp-2 text-sm font-medium">{name || flipbook.name || "Flipbook"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {currentPdfLabel}
                  </Badge>
                  <Badge variant="outline">{isPublished ? "Published" : "Draft"}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

export default EditFlipbookScreen
