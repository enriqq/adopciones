const PLACEHOLDER_COUNT = 9

export default function PetGridSkeleton() {
  return (
    <div
      className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Cargando mascotas"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-100 rounded-full w-16" />
              <div className="h-6 bg-gray-100 rounded-full w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
