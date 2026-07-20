"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Link } from "@/types"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { getIconForUrl } from "./social-icons"

export function LinkCard({ link, onEdit, onDelete }: { link: Link, onEdit: (l: Link) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 mb-4 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-2xl shadow-lg group transition-all duration-300 ${isDragging ? 'scale-105 shadow-2xl shadow-accent/20 border-accent/50' : 'hover:border-zinc-700 hover:shadow-xl hover:-translate-y-0.5'}`}
    >
      <div className="flex items-center gap-4 overflow-hidden flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-zinc-600 hover:text-white transition-colors bg-zinc-900/50 rounded-lg">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
            {getIconForUrl(link.url, "w-5 h-5")}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-white truncate text-lg">{link.title}</h3>
            <p className="text-sm text-zinc-400 truncate">{link.url}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(link)} 
          className="p-2 text-zinc-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all cursor-pointer"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onDelete(link.id)} 
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
