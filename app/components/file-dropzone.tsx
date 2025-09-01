"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

type FileDropzoneProps = {
  id: string
  label: string
  description?: string
  accept?: string
  maxSizeMB?: number
  value?: File | null
  onChange: (file: File | null) => void
  className?: string
}

export function FileDropzone({
  id,
  label,
  description,
  accept,
  maxSizeMB = 50,
  value,
  onChange,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const sizeLimitBytes = maxSizeMB * 1024 * 1024

  function handleBrowse() {
    inputRef.current?.click()
  }

  function validate(file: File) {
    if (file.size > sizeLimitBytes) {
      alert(`File too large. Max ${maxSizeMB}MB`)
      return false
    }
    return true
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!validate(file)) return
    onChange(file)
  }

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${id}-desc`}
        onClick={handleBrowse}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleBrowse()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          onFiles(e.dataTransfer.files)
        }}
        className={cn(
          "group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border bg-card transition-colors",
          "hover:bg-accent/40",
          isDragging && "border-emerald-500/70 bg-accent/60",
        )}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />

        {!value ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <Upload className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="text-sm">
              <span className="underline underline-offset-4">Click to upload</span> or drag & drop
            </p>
            {description ? (
              <p id={`${id}-desc`} className="text-xs text-muted-foreground">
                {description} • Max {maxSizeMB}MB
              </p>
            ) : (
              <p id={`${id}-desc`} className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB
              </p>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{(value.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
