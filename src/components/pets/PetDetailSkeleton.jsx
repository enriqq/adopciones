export default function PetDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded" />

      <div className="aspect-[4/3] rounded-2xl bg-gray-200" />

      <div className="space-y-3">
        <div className="h-10 w-3/4 bg-gray-200 rounded" />
        <div className="h-5 w-1/2 bg-gray-200 rounded" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 bg-gray-200 rounded-full" />
        <div className="h-8 w-32 bg-gray-200 rounded-full" />
        <div className="h-8 w-20 bg-gray-200 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="h-6 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>

      <div className="h-48 rounded-2xl bg-secondary/20 border-2 border-secondary/30" />

      <div className="h-16 w-full bg-gray-200 rounded-2xl" />
    </div>
  )
}
