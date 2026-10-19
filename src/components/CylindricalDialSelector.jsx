import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Minus, Plus, Disc, Sliders, Hash } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Premium Cylindrical Drum Dial Selector
 * 
 * Supports both:
 * 1. Dial Grinders: Stepless continuous millimetric drag (e.g., 10.12, 10.35)
 *    with visual unit tick steps based on dialSteps.
 * 2. Clicks Grinders: Tactile rotating ruler snapping strictly to integer clicks
 *    (1, 2, 3, ... totalClicks) with labels like "10 Clicks" / "Click 10".
 * 
 * Perfect CSS Alignment:
 * - Central needle/arrow pin, major numbers, and tick marks are mathematically
 *   centered at 50% on all container widths and screen sizes.
 * - Fluid typography and badges prevent container overflow or edge overlapping.
 */
export const CylindricalDialSelector = ({
  mode = 'dial', // 'dial' | 'clicks'
  value = 0,
  onChange,
  totalNumbers = 11,
  dialSteps = 4,
  totalClicks = 40,
  min = undefined,
  unit = '',
  disabled = false
}) => {
  const { t } = useLanguage();
  const isClicks = mode === 'clicks' || String(unit).toLowerCase().includes('click');
  const minVal = Number(min !== undefined ? min : (isClicks ? 1 : 0));
  const maxVal = isClicks ? Number(totalClicks || 40) : Number(totalNumbers || 11);
  const stepsPerNum = Math.max(1, Number(dialSteps) || 4);
  const subdivisions = stepsPerNum + 1; // subdivisions between integers

  // Geometry configuration
  const PX_PER_CLICK = 24;
  const PX_PER_SUBTICK = 16;
  const pxPerUnit = isClicks ? PX_PER_CLICK : subdivisions * PX_PER_SUBTICK;

  // Clamp helper
  const clamp = useCallback((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return minVal;
    return Math.max(minVal, Math.min(maxVal, num));
  }, [minVal, maxVal]);

  // Current numeric value clamped
  const numericValue = useMemo(() => {
    const clamped = clamp(value);
    return isClicks ? Math.round(clamped) : clamped;
  }, [value, isClicks, clamp]);

  // Pixel position of current value relative to track origin
  const currentPixelPos = useMemo(() => {
    return (numericValue - minVal) * pxPerUnit;
  }, [numericValue, minVal, pxPerUnit]);

  // Generate tick marks
  const ticks = useMemo(() => {
    const result = [];
    if (isClicks) {
      // 1 tick per integer click
      for (let c = minVal; c <= maxVal; c++) {
        const isMajor = (c % 5 === 0) || c === minVal || c === maxVal;
        const pixelPos = (c - minVal) * PX_PER_CLICK;
        result.push({
          key: `click_${c}`,
          val: c,
          pixelPos,
          isMajor,
          isMid: !isMajor && (c % 1 === 0),
          label: isMajor ? String(c) : null
        });
      }
    } else {
      // Dial: visual ticks between integers based on stepsPerNum
      const totalSubticks = (maxVal - minVal) * subdivisions;
      for (let s = 0; s <= totalSubticks; s++) {
        const intPart = minVal + Math.floor(s / subdivisions);
        const sub = s % subdivisions;
        const isMajor = sub === 0;
        const isMid = subdivisions >= 4 && sub === Math.round(subdivisions / 2);
        const tickVal = parseFloat((intPart + sub / subdivisions).toFixed(2));
        const pixelPos = s * PX_PER_SUBTICK;

        result.push({
          key: `sub_${s}`,
          val: tickVal,
          pixelPos,
          isMajor,
          isMid,
          label: isMajor ? String(intPart) : null
        });
      }
    }
    return result;
  }, [isClicks, minVal, maxVal, subdivisions, stepsPerNum]);

  // Drag interaction state
  const drumRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startVal: 0,
    currentVal: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    rafId: null
  });

  const [isInteracting, setIsInteracting] = useState(false);

  const getClientX = (e) => {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return e.clientX;
  };

  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    const clientX = getClientX(e);

    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
      dragState.current.rafId = null;
    }

    dragState.current = {
      isDragging: true,
      startX: clientX,
      startVal: numericValue,
      currentVal: numericValue,
      velocity: 0,
      lastX: clientX,
      lastTime: Date.now(),
      rafId: null
    };
    setIsInteracting(true);
  }, [disabled, numericValue]);

  const handleDragMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    const clientX = getClientX(e);
    const deltaX = dragState.current.startX - clientX;
    const deltaVal = deltaX / pxPerUnit;
    const rawVal = dragState.current.startVal + deltaVal;
    const clampedVal = clamp(rawVal);

    // Track momentum velocity
    const now = Date.now();
    const dt = now - dragState.current.lastTime;
    if (dt > 0) {
      dragState.current.velocity = (dragState.current.lastX - clientX) / dt;
    }
    dragState.current.lastX = clientX;
    dragState.current.lastTime = now;

    if (isClicks) {
      const snapped = Math.round(clampedVal);
      dragState.current.currentVal = snapped;
      onChange(snapped);
    } else {
      // Dial stepless continuous: smooth real-time update
      dragState.current.currentVal = clampedVal;
      onChange(parseFloat(clampedVal.toFixed(2)));
    }
  }, [isClicks, pxPerUnit, clamp, onChange]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;
    setIsInteracting(false);

    const velocity = dragState.current.velocity;
    const currentVal = dragState.current.currentVal;

    // Inertial momentum animation if user swiped with significant speed
    if (Math.abs(velocity) > 0.18) {
      const inertiaDistancePx = velocity * 130;
      const inertiaDeltaVal = inertiaDistancePx / pxPerUnit;
      const targetVal = clamp(currentVal + inertiaDeltaVal);
      const finalTarget = isClicks ? Math.round(targetVal) : parseFloat(targetVal.toFixed(2));

      let progress = 0;
      const startAnimVal = currentVal;

      const animate = () => {
        progress += 0.08;
        if (progress >= 1) {
          onChange(finalTarget);
          return;
        }
        // Cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        const intermediate = startAnimVal + (finalTarget - startAnimVal) * eased;
        const clampedInt = clamp(intermediate);

        if (isClicks) {
          onChange(Math.round(clampedInt));
        } else {
          onChange(parseFloat(clampedInt.toFixed(2)));
        }

        dragState.current.rafId = requestAnimationFrame(animate);
      };

      dragState.current.rafId = requestAnimationFrame(animate);
    } else {
      // Stepless drop: save the precise float value where user released drag
      if (!isClicks) {
        onChange(parseFloat(currentVal.toFixed(2)));
      } else {
        onChange(Math.round(currentVal));
      }
    }
  }, [isClicks, pxPerUnit, clamp, onChange]);

  // Window drag listeners
  useEffect(() => {
    const onMove = (e) => handleDragMove(e);
    const onEnd = (e) => handleDragEnd(e);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      if (dragState.current.rafId) {
        cancelAnimationFrame(dragState.current.rafId);
      }
    };
  }, [handleDragMove, handleDragEnd]);

  // Stepper handlers
  const handleStep = (delta) => {
    if (disabled) return;
    if (isClicks) {
      const next = Math.max(minVal, Math.min(maxVal, numericValue + delta));
      onChange(Math.round(next));
    } else {
      // In dial mode, step by 1 subdivision (e.g., 0.2 or 0.25) or 0.1
      const stepSize = parseFloat((1 / subdivisions).toFixed(2)) || 0.2;
      const next = Math.max(minVal, Math.min(maxVal, parseFloat((numericValue + delta * stepSize).toFixed(2))));
      onChange(next);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Header Row: Badge & Digital Readout with clean spacing ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Left Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            {isClicks ? <Hash className="w-4 h-4" /> : <Disc className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-coffee-700 dark:text-coffee-300 block truncate">
              {isClicks ? (t('clicksTitle') || 'Ajuste de Clicks') : (t('dialTitle') || 'Dial Calibrado')}
            </span>
            <span className="text-[11px] font-medium text-coffee-400 block truncate">
              {isClicks
                ? t('clicksTotal', { total: maxVal })
                : t('dialStepsSub', { steps: stepsPerNum })}
            </span>
          </div>
        </div>

        {/* Right Digital Readout */}
        <div className="flex-shrink-0 flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border shadow-xs">
          {isClicks ? (
            <>
              <span className="text-xs font-bold text-coffee-400 font-mono uppercase">
                {t('clickLabel') || 'Click'}
              </span>
              <span className="text-xl font-black font-mono text-terracotta tracking-tight">
                {Math.round(numericValue)}
              </span>
              <span className="text-[10px] font-semibold text-coffee-400 font-mono">
                / {maxVal}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-black font-mono text-terracotta tracking-tight">
                {numericValue.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-coffee-500 dark:text-coffee-400 font-mono">
                {numericValue % 1 === 0 ? t('wholeNumber') : t('stepNumber', { step: (numericValue % 1).toFixed(2) })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  3D CYLINDRICAL DRUM DIAL                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative select-none" style={{ touchAction: 'none' }}>
        
        {/* Metallic Bezel Housing */}
        <div
          className="relative rounded-3xl p-[2px] transition-shadow duration-300"
          style={{
            background: 'linear-gradient(180deg, #2a2520 0%, #1a1612 35%, #0f0d0b 100%)',
            boxShadow: isInteracting
              ? '0 10px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(217,83,79,0.3)'
              : '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          {/* Inner Drum Container */}
          <div
            ref={drumRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="relative h-28 rounded-[22px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{
              background: 'linear-gradient(180deg, #1e1a16 0%, #141210 50%, #1e1a16 100%)',
              cursor: disabled ? 'default' : isInteracting ? 'grabbing' : 'grab'
            }}
          >
            {/* Top Metallic Highlight Line */}
            <div
              className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none z-20"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent)'
              }}
            />

            {/* Fixed Central Needle / Indicator Arrow - PERFECTLY CENTERED AT 50% */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none"
              style={{ width: '16px' }}
            >
              {/* Triangular needle head */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '9px solid #e0534c',
                  filter: 'drop-shadow(0 0 6px rgba(224, 83, 76, 0.9))'
                }}
              />
              {/* Laser hairline down the drum */}
              <div
                style={{
                  width: '2px',
                  height: '70px',
                  background: 'linear-gradient(180deg, #e0534c 0%, rgba(224,83,76,0.3) 70%, transparent 100%)'
                }}
              />
            </div>

            {/* Curvature Vignettes (3D Cylindrical shadows) */}
            <div
              className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none z-15"
              style={{
                background: 'linear-gradient(180deg, rgba(12,10,8,0.9) 0%, transparent 100%)'
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none z-15"
              style={{
                background: 'linear-gradient(0deg, rgba(12,10,8,0.9) 0%, transparent 100%)'
              }}
            />
            {/* Left & Right Edge Fades */}
            <div
              className="absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-16"
              style={{
                background: 'linear-gradient(90deg, rgba(16,13,10,0.98) 0%, transparent 100%)'
              }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-16"
              style={{
                background: 'linear-gradient(270deg, rgba(16,13,10,0.98) 0%, transparent 100%)'
              }}
            />

            {/* Brushed Metal Background Texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  repeating-linear-gradient(
                    90deg,
                    rgba(255,255,255,0.007) 0px,
                    rgba(255,255,255,0.012) 1px,
                    transparent 1px,
                    transparent 3px
                  ),
                  radial-gradient(ellipse at 50% 50%, #1c1916 0%, #0e0c0a 100%)
                `
              }}
            />

            {/* ── THE SLIDING RULER TRACK ── */}
            {/* Origin at left: 50%. Shifted by -currentPixelPos so current tick aligns exactly with needle! */}
            <div
              className="absolute top-0 bottom-0 left-1/2 pointer-events-none"
              style={{
                width: 0,
                transform: `translateX(-${currentPixelPos}px)`,
                transition: isInteracting ? 'none' : 'transform 0.16s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              {ticks.map((t) => {
                const distFromCenter = Math.abs(t.pixelPos - currentPixelPos);
                // 3D perspective falloff based on distance from center needle
                const maxRange = 160;
                const normDist = Math.min(distFromCenter / maxRange, 1);
                const scale = Math.max(0.45, 1 - normDist * 0.35);
                const opacity = Math.max(0.12, 1 - normDist * 0.72);
                const isSelected = distFromCenter < (isClicks ? 8 : 4);

                return (
                  <div
                    key={t.key}
                    className="absolute top-0 bottom-0 flex flex-col items-center justify-between"
                    style={{
                      left: `${t.pixelPos}px`,
                      transform: `translateX(-50%) scaleY(${scale})`,
                      opacity,
                      width: `${isClicks ? PX_PER_CLICK : PX_PER_SUBTICK}px`,
                      paddingTop: '12px',
                      paddingBottom: '14px',
                      transition: isInteracting ? 'none' : 'opacity 0.15s ease, transform 0.15s ease'
                    }}
                  >
                    {/* Major Number Label (Positioned at top of cylinder) */}
                    {t.isMajor && t.label !== null ? (
                      <span
                        className="font-mono text-center select-none"
                        style={{
                          fontSize: isSelected ? '17px' : '13px',
                          fontWeight: isSelected ? 900 : 700,
                          color: isSelected ? '#d4af37' : 'rgba(180, 160, 130, 0.75)',
                          textShadow: isSelected ? '0 0 10px rgba(212,175,55,0.5)' : 'none',
                          letterSpacing: '-0.5px',
                          lineHeight: 1
                        }}
                      >
                        {t.label}
                      </span>
                    ) : (
                      <div className="h-4" />
                    )}

                    {/* Tick Mark Line */}
                    <div
                      style={{
                        width: t.isMajor ? '2.5px' : t.isMid ? '1.5px' : '1px',
                        height: t.isMajor ? '36px' : t.isMid ? '22px' : '13px',
                        borderRadius: '2px',
                        background: t.isMajor
                          ? isSelected
                            ? 'linear-gradient(180deg, #d4af37 0%, rgba(212,175,55,0.4) 100%)'
                            : 'linear-gradient(180deg, rgba(185,165,135,0.85) 0%, rgba(185,165,135,0.2) 100%)'
                          : t.isMid
                          ? 'linear-gradient(180deg, rgba(150,135,110,0.65) 0%, rgba(150,135,110,0.15) 100%)'
                          : 'linear-gradient(180deg, rgba(120,110,90,0.45) 0%, rgba(120,110,90,0.1) 100%)',
                        boxShadow: isSelected && t.isMajor ? '0 0 8px rgba(212,175,55,0.4)' : 'none'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Center Focal Glow behind the needle */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-full pointer-events-none z-14"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(224,83,76,0.08) 0%, transparent 70%)'
              }}
            />
          </div>
        </div>

        {/* Knurled Metal Grips Texture (Top and Bottom edge details) */}
        <div
          className="absolute -top-[2px] left-[15%] right-[15%] h-[2px] pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)'
          }}
        />
        <div
          className="absolute -bottom-[2px] left-[15%] right-[15%] h-[2px] pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STEPPER CONTROLS & READOUT PILL                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={disabled || numericValue <= minVal}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold transition-all active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs disabled:opacity-40"
          title={isClicks ? t('stepDownClick') : t('stepDown')}
          aria-label={isClicks ? t('stepDownClick') : t('stepDown')}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Center Position Display Pill */}
        <div className="flex-1 text-center py-2 px-3 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border font-mono text-xs font-bold text-coffee-800 dark:text-coffee-200 shadow-xs flex items-center justify-center gap-1.5 truncate">
          {isClicks ? (
            <span className="text-terracotta truncate">
              {t('clickCountOf', { current: Math.round(numericValue), total: maxVal })}
            </span>
          ) : (
            <>
              <span>{t('dialPosition', { pos: Math.floor(numericValue) })}</span>
              <span className="text-coffee-400 font-normal">
                • {numericValue % 1 === 0 ? t('dialZeroPoint') : `+${(numericValue % 1).toFixed(2)}`}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={disabled || numericValue >= maxVal}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-darkbg-card hover:bg-coffee-100 dark:hover:bg-darkbg-cardHover text-coffee-800 dark:text-coffee-200 flex items-center justify-center font-bold transition-all active:scale-90 border border-coffee-200/80 dark:border-darkbg-border shadow-xs disabled:opacity-40"
          title={isClicks ? t('stepUpClick') : t('stepUp')}
          aria-label={isClicks ? t('stepUpClick') : t('stepUp')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Range Extents Legend */}
      <div className="flex justify-between items-center text-[10px] text-coffee-500 dark:text-coffee-400 font-mono px-1">
        <span>{t('minLabel')}: {isClicks ? minVal : minVal.toFixed(1)}</span>
        <span className="text-[10px] font-semibold text-terracotta">
          {isClicks
            ? t('discretePositions', { count: maxVal - minVal + 1 })
            : t('micrometricDial')}
        </span>
        <span>{t('maxLabel')}: {isClicks ? maxVal : maxVal.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default CylindricalDialSelector;
