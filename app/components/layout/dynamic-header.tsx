"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { usePublish } from "../providers/publish.provider"
import { useFlipbook, useTogglePublish } from "@/lib/hooks/use-flipbooks"

interface RouteConfig {
  title: string
}

const getRouteConfig = (pathname: string): RouteConfig => {
  // Remove any trailing slashes and split the path
  const cleanPath = pathname.replace(/\/$/, '') || '/'
  const pathSegments = cleanPath.split('/').filter(Boolean)

  // Route configurations
  const routes: Record<string, RouteConfig> = {
    '/': {
      title: 'Dashboard'
    },
    '/dashboard': {
      title: 'Dashboard'
    },
    '/manage-flipbooks': {
      title: 'Manage Flipbooks'
    },
    '/manage-flipbooks/create': {
      title: 'Create Flipbook'
    },
    '/profile': {
      title: 'Profile'
    }
  }

  // Check for dynamic routes
  if (pathSegments.length >= 2 && pathSegments[0] === 'manage-flipbooks' && pathSegments[2] === 'edit') {
    return {
      title: 'Edit Flipbook'
    }
  }

  if (pathSegments.length >= 2 && pathSegments[0] === 'view') {
    return {
      title: 'View Flipbook'
    }
  }

  // Return the matched route or default
  return routes[cleanPath] || {
    title: 'Dashboard'
  }
}

export function DynamicHeader() {
  const pathname = usePathname()
  const routeConfig = getRouteConfig(pathname)

  // Determine context for publish controls
  const isCreatePage = pathname === '/manage-flipbooks/create'
  const isEditPage = useMemo(() => {
    const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
    return parts.length >= 3 && parts[0] === 'manage-flipbooks' && parts[2] === 'edit'
  }, [pathname])

  // Shared publish state (used on create page)
  const publishCtx = usePublish()

  // Edit page: derive id and hook into API for live status and toggle
  const editId = useMemo(() => {
    if (!isEditPage) return undefined
    const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
    return parts[1]
  }, [pathname, isEditPage])
  const { data: editFlipbook, isLoading: isEditLoading } = useFlipbook(editId || '')
  const togglePublish = useTogglePublish()

  return (
    <div className="flex justify-between items-center gap-2 p-4 border-b">
      <div className="flex items-center gap-2 flex-1">
        {/* Mobile hamburger to toggle sidebar */}
        <SidebarTrigger className="md:hidden" />
        {/* Title only */}
        <h1 className="text-lg font-semibold">{routeConfig.title}</h1>
      </div>
      {pathname === '/manage-flipbooks' && (
        <Button asChild className="flex items-center gap-2 cursor-pointer">
          <Link href="/manage-flipbooks/create">
            <Plus size={16} />
            <span className="max-[374px]:hidden">Create New Flipbook</span>
          </Link>
        </Button>
      )}
  {isCreatePage && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">Publish</span>
          <Switch
            id="create-publish-toggle"
    checked={publishCtx.createIsPublished}
    onCheckedChange={(v) => publishCtx.setCreateIsPublished(v)}
            aria-label="Publish immediately"
          />
        </div>
      )}
      {isEditPage && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">Publish</span>
          <Switch
            id="edit-publish-toggle"
            checked={!!editFlipbook?.is_published}
            disabled={!editId || isEditLoading || togglePublish.isPending}
            onCheckedChange={() => editId && togglePublish.mutate(editId)}
            aria-label="Toggle publish"
          />
        </div>
      )}
    </div>
  )
}