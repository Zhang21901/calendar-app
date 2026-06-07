import { useCallback } from 'react';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useTasks } from '../context';
import type { DragPayload } from '../types';

export function useDragAndDrop() {
  const { scheduleTask, copyTask } = useTasks();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragPayload | undefined;
    if (!data) return;

    const altKey = (event.activatorEvent as PointerEvent).altKey;
    data.action = altKey ? 'copy' : 'move';
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by CSS via useDroppable isOver state
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    const data = active.data.current as DragPayload | undefined;
    if (!data) return;

    const droppableId = over.id as string;

    // Drop back to pool
    if (droppableId === 'pool') {
      await scheduleTask(data.taskId, null, null);
      return;
    }

    // Drop on a day: 'day:YYYY-MM-DD'
    if (droppableId.startsWith('day:')) {
      const date = droppableId.replace('day:', '');
      if (data.action === 'copy') {
        const newTask = await copyTask(data.taskId);
        await scheduleTask(newTask.id, date);
      } else {
        await scheduleTask(data.taskId, date);
      }
      return;
    }

    // Drop on timeline slot: 'timeline:YYYY-MM-DD:HH:MM'
    if (droppableId.startsWith('timeline:')) {
      const [, date, time] = droppableId.split(':');
      if (data.action === 'copy') {
        const newTask = await copyTask(data.taskId);
        await scheduleTask(newTask.id, date, time);
      } else {
        await scheduleTask(data.taskId, date, time);
      }
      return;
    }
  }, [scheduleTask, copyTask]);

  return { handleDragStart, handleDragEnd, handleDragOver };
}
