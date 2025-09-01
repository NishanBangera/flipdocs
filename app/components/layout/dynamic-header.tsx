"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

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
    <div className="flex items-center gap-2 p-4 border-b">
      <SidebarTrigger className="-ml-1" />
      
      <div className="flex-1">
        {/* Title only */}
        <h1 className="text-lg font-semibold">{routeConfig.title}</h1>
      </div>
    </div>
  )
}