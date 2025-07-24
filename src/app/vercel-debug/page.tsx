import VercelDebug from "@/components/debug/VercelDebug"

export default function VercelDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Vercel Deployment Debug</h1>
      <VercelDebug />
    </div>
  )
}