import React, { useMemo, useRef, useState } from 'react';
import { Minus, Plus, Disc } from 'lucide-react';

/**
 * Mahlkönig-style Dial Ruler Slider Component
 * 
 * Step logic:
 * When dialSteps = 4, the sequence between 4 and 5 is:
 * 4.0 -> 4.1 -> 4.2 -> 4.3 -> 4.4 -> 5.0
 * 
 * Features:
 * - Starts at whole integer (0 or 1) up to totalNumbers.
 * - Subdivisions between each integer X are X.1, X.2, ... X.dialSteps, followed by X+1.0.
 * - Calibrated horizontal ruler with prominent major numbers and sub-ticks for each point.
 * - Touch-friendly slider thumb with drag tracking for mobile screens.
 * - Displays both the formatted decimal value (e.g. 4.3) and the descriptive step (e.g. paso 3 de 4).
 */
export const DialSlider = ({
  value = 0,
  onChange,
  totalNumbers = 11,
  dialSteps = 4,
  min = 0,
  unit = 'Dial',
  disabled = false
}) => {
  const minVal = Number(min) || 0;
  const maxVal = Number(totalNumbers) || 11;
  const stepsPerNum = Math.max(1, Number(dialSteps) || 1);
  const clicksPerNumber = stepsPerNum + 1; // e.g. for 4: 0, .1, .2, .3, .4 -> 5 total clicks per whole integer
  const totalClicks = (maxVal - minVal) * clicksPerNumber;

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Convert discrete click index (0..totalClicks) to decimal value (e.g. 4.0, 4.1, ..., 4.4, 5.0)
  const clickIndexToValue = (clickIndex) => {
    const major = minVal + Math.floor(clickIndex / clicksPerNumber);
    const subStep = clickIndex % clicksPerNumber;
    if (major >= maxVal) {
      return parseFloat(maxVal.toFixed(1));
    }
    const val = major + subStep * 0.1;
    return parseFloat(val.toFixed(1));
  };

  // Convert decimal value (e.g. 4.3) back to discrete click index
  const valueToClickIndex = (val) => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = minVal;
    parsed = Math.max(minVal, Math.min(maxVal, parsed));
    const major = Math.floor(parsed);
    if (major >= maxVal) {
      return totalClicks;
    }
    const fraction = parsed - major;
    let subStep = Math.round(fraction * 10);
    if (subStep > stepsPerNum) subStep = stepsPerNum;
    return (major - minVal) * clicksPerNumber + subStep;
  };

  // Current discrete click index
  const currentClickIndex = useMemo(() => {
    return valueToClickIndex(value);
  }, [value, minVal, maxVal, stepsPerNum, clicksPerNumber]);

  // Current normalized decimal value
  const currentValue = useMemo(() => {
    return clickIndexToValue(currentClickIndex);
  }, [currentClickIndex, minVal, maxVal, clicksPerNumber]);

  // Breakdown for descriptive display
  const { majorNumber, subStepIndex } = useMemo(() => {
    const major = Math.floor(currentValue);
    const sub = Math.round((currentValue - major) * 10);
    return {
      majorNumber: major,
      subStepIndex: sub
    };
  }, [currentValue]);

  // Stepper handlers
  const handleStepChange = (delta) => {
    if (disabled) return;
    const nextClick = Math.max(0, Math.min(totalClicks, currentClickIndex + delta));
    const nextVal = clickIndexToValue(nextClick);
    onChange(nextVal);
  };

  // Percentage for needle tracking
  const percentage = useMemo(() => {
    if (totalClicks <= 0) return 0;
    return Math.max(0, Math.min(100, (currentClickIndex / totalClicks) * 100));
  }, [currentClickIndex, totalClicks]);

  // Array of major numbers [min..max]
  const majorNumbers = useMemo(() => {
    const list = [];
    for (let i = minVal; i <= maxVal; i++) {
      list.push(i);
    }
    return list;
  }, [minVal, maxVal]);

  // Direct click or touch on ruler track
  const handleTrackPointer = (e) => {
    if (disabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return;

    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = clickX / rect.width;
    const targetClick = Math.round(ratio * totalClicks);
    const clampedClick = Math.max(0, Math.min(totalClicks, targetClick));
    onChange(clickIndexToValue(clampedClick));
  };

  return (
    <div className="space-y-3.5 bg-coffee-100/40 dark:bg-darkbg-input/40 p-4 rounded-3xl border border-coffee-200/70 dark:border-darkbg-border">
      {/* Top Header: Badge & Value display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Disc className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-coffee-600 dark:text-coffee-300 block">
              Dial Calibrado
            </span>
            <span className="text-[11px] font-medium text-coffee-400">
              {stepsPerNum} pasos por número (.1 a .{stepsPerNum})
            </span>
          </div>
        </div>

        {/* Current Readout */}
        <div className="flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border shadow-xs">
          <span className="text-xl font-black font-mono text-terracotta tracking-tight">
            {currentValue.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-coffee-500 dark:text-coffee-400 font-mono">
            {subStepIndex > 0 ? `(paso ${subStepIndex} de ${stepsPerNum})` : '(entero)'}
          </span>
        </div>
      </div>

      {/* Stepper Controls + Indicator Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStepChange(-1)}
          disabled={disabled || currentClickIndex <= 0}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold transition-all active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs disabled:opacity-40"
          title="Restar paso"
          aria-label="Restar paso"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Big Touch Stepper Bar */}
        <div className="flex-1 text-center py-2 px-3 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border font-mono text-sm font-bold text-coffee-800 dark:text-coffee-200 shadow-xs flex items-center justify-center gap-2">
          <span>Posición {majorNumber}</span>
          <span className="text-xs text-coffee-400">
            • {subStepIndex > 0 ? `Subpaso .${subStepIndex}` : 'Punto Cero'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStepChange(1)}
          disabled={disabled || currentClickIndex >= totalClicks}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold transition-all active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs disabled:opacity-40"
          title="Sumar paso"
          aria-label="Sumar paso"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* MAHLKÖNIG-STYLE HORIZONTAL DIAL RULER */}
      <div className="relative pt-4 pb-2 px-2 select-none">
        {/* Ruler Track Container */}
        <div
          ref={containerRef}
          onClick={handleTrackPointer}
          className="relative h-14 bg-coffee-900 dark:bg-black rounded-2xl p-2 cursor-pointer shadow-inner overflow-hidden border border-coffee-800"
        >
          {/* Subtle Top Metallic Glow Line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-coffee-600 via-amber-400 to-coffee-600 opacity-60" />

          {/* Major Numbers Row */}
          <div className="relative h-5 flex justify-between items-center text-[10px] font-mono font-bold text-coffee-300 pointer-events-none px-1">
            {majorNumbers.map((num) => {
              const isActive = majorNumber === num;
              return (
                <span
                  key={num}
                  className={`transition-colors text-center w-4 ${
                    isActive ? 'text-amber-400 font-black scale-110' : 'text-coffee-400/80'
                  }`}
                >
                  {num}
                </span>
              );
            })}
          </div>

          {/* Tick Marks Ruler Line */}
          <div className="relative h-5 flex justify-between items-end px-1 pointer-events-none">
            {majorNumbers.map((num, i) => {
              const isLast = i === majorNumbers.length - 1;
              return (
                <div key={num} className="flex-1 flex justify-between items-end h-full">
                  {/* Major Tick (Tallest for integer number) */}
                  <div className="w-[2px] h-4 bg-amber-400/90 rounded-full" />

                  {/* Subdivisions .1, .2, ..., .dialSteps between this number and the next */}
                  {!isLast &&
                    Array.from({ length: stepsPerNum }).map((_, stepIdx) => {
                      const isMid = stepsPerNum % 2 === 0 && stepIdx === stepsPerNum / 2 - 1;
                      return (
                        <div
                          key={stepIdx}
                          className={`rounded-full ${
                            isMid
                              ? 'w-[1.5px] h-2.5 bg-coffee-200/80'
                              : 'w-[1px] h-1.5 bg-coffee-400/60'
                          }`}
                        />
                      );
                    })}

                  {/* Final edge tick */}
                  {isLast && (
                    <div className="w-[2px] h-4 bg-amber-400/90 rounded-full ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Precision Needle Pointer */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75 flex flex-col items-center"
            style={{
              left: `${percentage}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Needle Top Arrow */}
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-terracotta" />
            {/* Needle Line */}
            <div className="w-[2px] flex-1 bg-terracotta shadow-[0_0_8px_rgba(217,83,79,0.9)]" />
          </div>
        </div>

        {/* Range Slider for direct dragging */}
        <input
          type="range"
          min={0}
          max={totalClicks}
          step={1}
          value={currentClickIndex}
          onChange={(e) => onChange(clickIndexToValue(parseInt(e.target.value)))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className="absolute inset-x-2 bottom-1 h-8 opacity-0 cursor-ew-resize z-20"
          aria-label="Ajuste de grado en dial"
        />

        {/* Legend / Range Extents */}
        <div className="flex justify-between items-center text-[10px] text-coffee-500 dark:text-coffee-400 font-mono mt-1 px-1">
          <span>Min: {minVal.toFixed(1)}</span>
          <span className="text-[10px] font-semibold text-terracotta">
            Escala: 4, 4.1... 4.{stepsPerNum} → 5
          </span>
          <span>Max: {maxVal.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export default DialSlider;
