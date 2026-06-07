import { AppProvider, TaskProvider, TimerProvider } from './context';
import { AppLayout } from './components/layout/AppLayout';

export default function App() {
  return (
    <AppProvider>
      <TaskProvider>
        <TimerProvider>
          <AppLayout />
        </TimerProvider>
      </TaskProvider>
    </AppProvider>
  );
}
