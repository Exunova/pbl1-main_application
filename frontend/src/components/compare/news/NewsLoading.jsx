export default function NewsLoading() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 border-b border-border p-4 animate-pulse"
        >
          <div className="flex-1">

            <div className="h-2.5 bg-border w-1/3 mb-3 rounded" />

            <div className="h-3 bg-border w-full mb-1.5 rounded" />

            <div className="h-3 bg-border w-4/5 rounded" />

          </div>
        </div>
      ))}
    </>
  )
}