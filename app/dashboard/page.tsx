"use client";

import { useDashboardStats } from "@/lib/hooks/use-flipbooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "../components/ui/loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

dayjs.extend(relativeTime);

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  isLoading 
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  // Don't render anything until user auth state is loaded
  if (!isUserLoaded || !isSignedIn) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("Dashboard stats:", stats);

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message={error.message || "Failed to load dashboard data"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your flipbooks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Flipbooks"
          value={stats?.total ?? 0}
          description="All your flipbooks"
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatCard
          title="Published"
          value={stats?.published ?? 0}
          description="Live flipbooks"
          icon={Eye}
          isLoading={isLoading}
        />
        <StatCard
          title="Unpublished"
          value={stats?.unpublished ?? 0}
          description="Draft flipbooks"
          icon={EyeOff}
          isLoading={isLoading}
        />
        <StatCard
          title="Recent Activity"
          value={stats?.recent?.length ?? 0}
          description="Recent uploads"
          icon={Clock}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Flipbooks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Flipbooks</CardTitle>
          <CardDescription>
            Your most recently created flipbooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recent && stats.recent.length > 0 ? (
            <div className="space-y-4">
              {stats.recent.slice(0, 5).map((flipbook) => (
                <div key={flipbook.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{flipbook.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{flipbook.slug}</span>
                        <span>•</span>
                        <span>{dayjs(flipbook.created_at).fromNow()}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          flipbook.is_published 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {flipbook.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/manage-flipbooks`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No flipbooks yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first flipbook.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/manage-flipbooks">
                    Create Flipbook
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
