'use client';

const SLIDER_ACCENT = '#f97316';

type PriceRangeSliderProps = {
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

export function PriceRangeSlider({
  min,
  max,
  step,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: PriceRangeSliderProps) {
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  function clamp(value: number) {
    return Math.min(max, Math.max(min, value));
  }

  function handleMinInput(raw: string) {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onMinChange(clamp(Math.min(parsed, maxValue)));
  }

  function handleMaxInput(raw: string) {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onMaxChange(clamp(Math.max(parsed, minValue)));
  }

  return (
    <div className="price-range-slider space-y-3">
      <div className="relative mx-1 h-7">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
            backgroundColor: SLIDER_ACCENT,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => onMinChange(Math.min(Number(e.target.value), maxValue))}
          className="price-range-slider-input"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => onMaxChange(Math.max(Number(e.target.value), minValue))}
          className="price-range-slider-input"
          aria-label="Maximum price"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-xs text-zinc-500">Min Price</span>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={(e) => handleMinInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs text-zinc-500">Max Price</span>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={(e) => handleMaxInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
