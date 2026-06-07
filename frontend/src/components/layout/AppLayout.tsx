import { useEffect } from 'react';
import { useApp } from '../../context';
import { Sidebar } from '../sidebar/Sidebar';
import { CalendarArea } from './CalendarArea';
import { DashboardDrawer } from '../dashboard/DashboardDrawer';
import { DayDetailPage } from '../daydetail/DayDetailPage';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

export function AppLayout() {
  const { viewMode, dashboardOpen, setViewMode, toggleDarkMode } = useApp();
  const { handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        setViewMode('month');
        // Navigate to today
      }
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        toggleDarkMode();
      }
      if (e.key === 'Escape') {
        if (viewMode === 'dayDetail') setViewMode('month');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setViewMode, toggleDarkMode, viewMode]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {viewMode === 'dayDetail' ? <DayDetailPage /> : <CalendarArea />}
        </div>
        {dashboardOpen && <DashboardDrawer />}
      </div>
    </DndContext>
  );
}
