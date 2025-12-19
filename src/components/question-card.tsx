import type { LucideIcon } from "lucide-react"

interface QuestionCardProps {
  icon: LucideIcon
  question: string
}

export default function QuestionCard({ icon: Icon, question }: QuestionCardProps) {
  return (
    <button className="flex items-center space-x-3 p-4 rounded-lg bg-black/40 hover:bg-black/50 backdrop-blur-sm border border-white/10 transition-colors">
      <Icon className="w-5 h-5 text-white/70" />
      <span className="text-white text-sm">{question}</span>
    </button>
  )
}

