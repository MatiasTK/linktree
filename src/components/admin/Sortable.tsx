'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

interface SortableProps<T extends { id: number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: ReactNode;
}

/** Vertical drag-to-reorder list; items are rendered with <SortableRow>. */
export function Sortable<T extends { id: number }>({ items, onReorder, children }: SortableProps<T>) {
  // a stable id keeps dnd-kit's accessibility ids equal on server and client
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export interface DragHandleProps {
  attributes: HTMLAttributes<HTMLElement>;
  listeners: Record<string, unknown> | undefined;
}

interface SortableRowProps {
  id: number;
  className: string;
  label: string;
  children: (handle: ReactNode) => ReactNode;
  as?: 'div' | 'li';
  dataAttrs?: Record<string, string | undefined>;
}

/** One reorderable row; `children` receives the drag handle to place where it belongs. */
export function SortableRow({ id, className, label, children, as: Tag = 'div', dataAttrs }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition };

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="adm-handle"
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}`}
      aria-roledescription="drag handle"
    >
      <GripVertical size={16} aria-hidden />
    </button>
  );

  return (
    <Tag ref={setNodeRef as never} style={style} className={className} data-dragging={isDragging || undefined} {...dataAttrs}>
      {children(handle)}
    </Tag>
  );
}
