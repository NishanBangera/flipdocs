"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

  return (
    <div className="flex justify-between items-center gap-2 p-4 border-b">
      <div className="flex-1">
        {/* Title only */}
        <h1 className="text-lg font-semibold">{routeConfig.title}</h1>
      </div>
      {pathname === '/manage-flipbooks' && (
        <Button asChild className="flex items-center gap-2 cursor-pointer">
          <Link href="/manage-flipbooks/create">
            <Plus size={16} />
            Create New Flipbook
          </Link>
        </Button>
      )}
    </div>
  )
}