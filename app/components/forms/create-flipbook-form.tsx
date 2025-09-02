"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FileDropzone } from "../file-dropzone"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  name: string
  setName: (v: string) => void
  pdfFile: File | null
  setPdfFile: (f: File | null) => void
  bgImage: File | null
  setBgImage: (f: File | null) => void
  coverImage: File | null
  setCoverImage: (f: File | null) => void
  publishNow: boolean
  setPublishNow: (v: boolean) => void
  onSubmit: () => void
  onCancel?: () => void
  errors?: Record<string, string>
  isLoading?: boolean
}

export function CreateFlipbookForm({
  name,
  setName,
  pdfFile,
  setPdfFile,
  bgImage,
  setBgImage,
  coverImage,
  setCoverImage,
  publishNow,
  setPublishNow,
  onSubmit,
  onCancel,
  errors = {},
  isLoading = false,
}: Props) {
  const isReady = name.trim().length > 0 && !!pdfFile

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

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="flipbook-name">Flipbook name</Label>
          <Input
            id="flipbook-name"
            placeholder="e.g. Autumn Catalog 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <FileDropzone
            id="flipbook-pdf"
            label="PDF file"
            description="PDF only"
            accept="application/pdf"
            value={pdfFile}
            onChange={setPdfFile}
            maxSizeMB={100}
          />
          {errors.pdf && <p className="text-xs text-destructive">{errors.pdf}</p>}
        </div>

        <div className="space-y-1">
          <FileDropzone
            id="flipbook-bg"
            label="Background image (optional)"
            description="PNG, JPG, or GIF up to 10MB"
            accept="image/png,image/jpeg,image/gif"
            value={bgImage}
            onChange={setBgImage}
            maxSizeMB={10}
          />
          {errors.background && <p className="text-xs text-destructive">{errors.background}</p>}
        </div>

        <div className="space-y-1">
          <FileDropzone
            id="flipbook-cover"
            label="Cover image (optional)"
            description="PNG, JPG, or GIF up to 10MB"
            accept="image/png,image/jpeg,image/gif"
            value={coverImage}
            onChange={setCoverImage}
            maxSizeMB={10}
          />
          {errors.cover && <p className="text-xs text-destructive">{errors.cover}</p>}
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
            checked={publishNow}
            onCheckedChange={setPublishNow}
            aria-label="Publish immediately"
            disabled={isLoading}
          />
        </div>

        {/* <ul className="grid gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Use high-resolution PDFs for best quality.
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Add an optional background to personalize the cover.
          </li>
        </ul> */}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !isReady}
          className={cn("bg-emerald-500 text-black hover:bg-emerald-400", (!isReady || isLoading) && "pointer-events-none opacity-60")}
        >
          {isLoading ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            "Create flipbook"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
