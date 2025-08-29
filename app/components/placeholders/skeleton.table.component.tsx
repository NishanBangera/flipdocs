import { Skeleton } from "@/components/ui/skeleton";

function SkeletonTable() {
  return (
    <div className="space-y-3 p-8">
      <div className="p-3 bg-secondary-100 rounded-lg flex items-center justify-between">
        <div className="inline-flex space-x-2">
          <Skeleton className="h-4 min-w-[50px] w-full" />
          <Skeleton className="h-4 min-w-[50px] w-full" />
        </div>
        <div className="inline-flex space-x-2">
          <Skeleton className="h-4 min-w-[50px] w-full rounded-full" />
        </div>
        <div className="inline-flex justify-end space-x-2">
          <Skeleton className="h-4 w-4 rounded-full flex-none " />
          <Skeleton className="h-4 w-4 rounded-full flex-none " />
          <Skeleton className="h-4 w-4 rounded-full flex-none " />
        </div>
      </div>
      <div>
        <Skeleton className="h-6 min-w-[200px]" />
      </div>
      <div className="grid grid-cols-5 gap-3 w-full">
        <Skeleton className="h-4 min-w-[100px] w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="grid grid-cols-5 gap-3 w-full">
        <div className="min-w-100 w-full flex items-center justify-between">
          <Skeleton className="h-4 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-4 w-0 flex-grow" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="min-w-100 w-full flex items-center justify-end">
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 w-full">
        <div className="min-w-100 w-full flex items-center justify-between">
          <Skeleton className="h-4 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-4 w-0 flex-grow" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="min-w-100 w-full flex items-center justify-end">
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 w-full">
        <div className="min-w-100 w-full flex items-center justify-between">
          <Skeleton className="h-4 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-4 w-0 flex-grow" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="min-w-100 w-full flex items-center justify-end">
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3 w-full">
        <div className="min-w-100 w-full flex items-center justify-between">
          <Skeleton className="h-4 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-4 w-0 flex-grow" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="min-w-100 w-full flex items-center justify-end">
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
          <Skeleton className="h-2 w-4 rounded-full flex-none mr-2" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonTable;
