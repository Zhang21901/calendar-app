const COLORS: Record<string, string> = {
  P0: 'bg-red-500 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-blue-500 text-white',
  P3: 'bg-gray-400 text-white',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${COLORS[priority] || COLORS.P3}`}>
      {priority}
    </span>
  );
}
