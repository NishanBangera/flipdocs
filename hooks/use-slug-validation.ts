"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useFlipbookApi } from "@/lib/api"
import { generateSlugFromName } from "@/lib/utils/slug"

interface SlugValidationState {
  isValidating: boolean
  isValid: boolean
  message: string
  suggestedSlug?: string
}

interface UseSlugValidationProps {
  mode: "create" | "edit"
  flipbookId?: string
  originalSlug?: string
}

export function useSlugValidation({ mode, flipbookId, originalSlug }: UseSlugValidationProps) {
  const [validation, setValidation] = useState<SlugValidationState>({
    isValidating: false,
    isValid: true,
    message: ""
  })
  const [hasUserModified, setHasUserModified] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const flipbookApi = useFlipbookApi()

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const validateSlug = useCallback(async (slug: string) => {
    if (!slug.trim()) {
      setValidation({ isValidating: false, isValid: true, message: "" })
      return
    }

    const activeElement = document.activeElement

    setValidation(prev => {
      if (prev.isValidating) return prev
      return { ...prev, isValidating: true }
    })

    try {
      const result = await flipbookApi.validateSlug(
        slug,
        mode === "edit" ? flipbookId : undefined
      )

      const newState: SlugValidationState = result.available ? {
        isValidating: false,
        isValid: true,
        message: "Slug is available"
      } : {
        isValidating: false,
        isValid: false,
        message: `Slug is already taken. Suggested: ${result.suggestedSlug}`,
        suggestedSlug: result.suggestedSlug
      }

      setValidation(newState)

      // Restore focus if it was lost
      if (activeElement === inputRef.current && document.activeElement !== inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    } catch {
      setValidation({
        isValidating: false,
        isValid: false,
        message: "Error validating slug"
      })

      // Restore focus if it was lost
      if (activeElement === inputRef.current && document.activeElement !== inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
  }, [flipbookApi, mode, flipbookId])

  const debouncedValidate = useCallback((slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const currentSlug = slug.trim()
    const original = originalSlug || ""
    
    // If in edit mode and slug matches original, show "Current slug" without API call
    if (mode === "edit" && currentSlug === original && currentSlug) {
      setValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
      return
    }

    // Only validate if user has modified slug and it's different from original, or in create mode
    if (currentSlug && ((hasUserModified && mode === "edit" && currentSlug !== original) || mode === "create")) {
      timeoutRef.current = setTimeout(() => {
        validateSlug(currentSlug)
      }, 500)
    } else if (!currentSlug) {
      setValidation({ isValidating: false, isValid: true, message: "" })
    }
  }, [validateSlug, hasUserModified, mode, originalSlug])

  const handleSlugChange = useCallback((value: string, onSlugChange?: (slug: string) => void) => {
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    
    if (!hasUserModified) {
      setHasUserModified(true)
    }
    
    onSlugChange?.(sanitizedSlug)
    debouncedValidate(sanitizedSlug)
    
    return sanitizedSlug
  }, [hasUserModified, debouncedValidate])

  const handleSlugBlur = useCallback((slug: string) => {
    const currentSlug = slug.trim()
    const original = originalSlug || ""
    
    // If in edit mode and slug matches original, show "Current slug" without API call
    if (mode === "edit" && currentSlug === original && currentSlug) {
      setValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
    }
  }, [mode, originalSlug])

  const generateFromName = useCallback(async (name: string, onSlugChange?: (slug: string) => void) => {
    if (!name.trim()) return ""

    const baseSlug = generateSlugFromName(name)

    try {
      const result = await flipbookApi.validateSlug(
        baseSlug,
        mode === "edit" ? flipbookId : undefined
      )

      const finalSlug = result.suggestedSlug || baseSlug
      setHasUserModified(true)
      onSlugChange?.(finalSlug)

      setValidation({
        isValidating: false,
        isValid: result.available || !!result.suggestedSlug,
        message: result.available
          ? "Slug is available"
          : result.suggestedSlug
            ? `Original slug taken, using: ${result.suggestedSlug}`
            : "Slug is taken",
        suggestedSlug: result.suggestedSlug
      })

      return finalSlug
    } catch {
      setHasUserModified(true)
      onSlugChange?.(baseSlug)
      
      setValidation({
        isValidating: false,
        isValid: false,
        message: "Error generating slug, please check manually"
      })

      return baseSlug
    }
  }, [flipbookApi, mode, flipbookId])

  const useSuggestion = useCallback((onSlugChange?: (slug: string) => void) => {
    if (!validation.suggestedSlug) return

    const suggestedSlug = validation.suggestedSlug
    setHasUserModified(true)
    onSlugChange?.(suggestedSlug)
    
    // Check if suggested slug is same as original
    const original = originalSlug || ""
    if (mode === "edit" && suggestedSlug === original) {
      setValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
    } else {
      validateSlug(suggestedSlug)
    }
  }, [validation.suggestedSlug, validateSlug, mode, originalSlug])

  // Initialize validation for edit mode
  const initializeForEdit = useCallback((slug: string) => {
    if (mode === "edit" && originalSlug && slug === originalSlug) {
      setValidation({
        isValidating: false,
        isValid: true,
        message: "Current slug"
      })
    }
  }, [mode, originalSlug])

  return {
    validation,
    inputRef,
    handleSlugChange,
    handleSlugBlur,
    generateFromName,
    useSuggestion,
    initializeForEdit
  }
}