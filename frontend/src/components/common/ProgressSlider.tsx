interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function ProgressSlider({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${value}%, var(--color-border) ${value}%)`,
          accentColor: 'var(--color-accent)',
        }}
      />
      <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--color-text-secondary)' }}>
        {value}%
      </span>
    </div>
  );
}
