"use client"

import React, { createContext, useContext, useState } from "react"

type PublishContextValue = {
  // Used only for the Create Flipbook flow
  createIsPublished: boolean
  setCreateIsPublished: (value: boolean) => void
}

const PublishContext = createContext<PublishContextValue | undefined>(undefined)

export function PublishProvider({ children }: { children: React.ReactNode }) {
  const [createIsPublished, setCreateIsPublished] = useState<boolean>(true)

  return (
    <PublishContext.Provider value={{ createIsPublished, setCreateIsPublished }}>
      {children}
    </PublishContext.Provider>
  )
}

export function usePublish() {
  const ctx = useContext(PublishContext)
  if (!ctx) throw new Error("usePublish must be used within a PublishProvider")
  return ctx
}
