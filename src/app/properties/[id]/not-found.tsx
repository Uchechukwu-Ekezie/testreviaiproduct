import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <div className="text-8xl font-bold text-[#FFD700] mb-4">404</div>
          <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
          <p className="text-white/70 mb-8">
            The property you're looking for doesn't exist or may have been removed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/properties"
            className="flex items-center gap-2 bg-[#FFD700] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA500] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}