"use client"

import * as React from "react"
import { CreateFlipbookForm } from "./create-flipbook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { FileText } from "lucide-react"
import { useCreateFlipbook } from "@/lib/hooks/use-flipbooks"
import { CreateFlipbookData } from "@/lib/types"
import { useRouter } from "next/navigation"

export function CreateFlipbookScreen() {
  const router = useRouter()
  const createFlipbook = useCreateFlipbook()
  
  const [name, setName] = React.useState("")
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [bgImage, setBgImage] = React.useState<File | null>(null)
  const [publishNow, setPublishNow] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Flipbook name is required"
    }

    if (!pdfFile) {
      newErrors.pdf = "PDF file is required"
    } else if (pdfFile.type !== "application/pdf") {
      newErrors.pdf = "File must be a PDF"
    }

    if (bgImage && !bgImage.type.startsWith("image/")) {
      newErrors.background = "Background file must be an image"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return

    const createData: CreateFlipbookData = {
      name: name.trim(),
      pdf: pdfFile!,
      backgroundImage: bgImage || undefined,
      isPublished: publishNow,
    }

    try {
      await createFlipbook.mutateAsync(createData)
      // On success, navigate back to manage flipbooks or dashboard
      router.push('/manage-flipbooks')
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error creating flipbook:", error)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <CreateFlipbookForm
          name={name}
          setName={setName}
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          bgImage={bgImage}
          setBgImage={setBgImage}
          publishNow={publishNow}
          setPublishNow={setPublishNow}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          errors={errors}
          isLoading={createFlipbook.isPending}
        />
      </div>

      <aside className="md:col-span-2">
        <Card className="sticky top-6 border-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border bg-secondary/20">
              <div className="aspect-[3/4] w-full">
                {/* If a background image is selected, we cannot preview it directly without reading the file.
                    We'll show a subtle placeholder instead. */}
                <Image
                  src={"/placeholder.svg?height=600&width=450&query=flipbook%20cover%20placeholder"}
                  alt="Flipbook cover preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-background/70 p-3">
                <p className="line-clamp-2 text-sm font-medium">{name || "Your flipbook name"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {pdfFile ? pdfFile.name : "No PDF selected"}
                  </Badge>
                  <Badge variant="outline">{publishNow ? "Will publish" : "Draft"}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              Tip: You can upload now and publish later. Add background art to make your flipbook stand out.
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
