"use client"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { LinkCard } from "./link-card"
import { LinkForm } from "./link-form"
import type { Link } from "@/types"
import { useState } from "react"

export function SortableList({
  items,
  setItems,
  onEdit,
  onDelete,
  onReorder
}: {
  items: Link[]
  setItems: (items: Link[]) => void
  onEdit: (data: { id: string, title: string, url: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (items: Link[]) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      
      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index
      }))
      
      setItems(newItems)
      onReorder(newItems)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((link) => (
            <div key={link.id}>
              {editingId === link.id ? (
                <LinkForm 
                  initialData={link} 
                  onSubmit={async (data) => {
                    await onEdit({ id: link.id, ...data })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <LinkCard 
                  link={link} 
                  onEdit={() => setEditingId(link.id)} 
                  onDelete={() => onDelete(link.id)} 
                />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
