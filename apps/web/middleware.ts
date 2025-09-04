import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/', 
  '/view(.*)', 
  '/api/health(.*)',
  '/_not-found'
])

export default clerkMiddleware(async (auth, req) => {
  // Skip auth during build time (when using placeholder keys)
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_build_placeholder") {
    return
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}