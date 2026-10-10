import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Minus, Plus, Disc } from 'lucide-react';

/**
 * Premium Cylindrical Drum Dial Selector
 * 
 * A realistic horizontal rotating cylinder/ring component inspired by
 * manual coffee grinder adjustment rings (1Zpresso / Timemore / Fellow Ode).
 * 
 * Features:
 * - 3D cylindrical perspective with center-focused curvature
 * - Laser-etched style tick marks and numbers on brushed dark metal
 * - Fixed red indicator triangle at top center
 * - Touch + mouse drag rotation with momentum
 * - Snap-to-nearest step behavior
 * - Sub-tick marks between major numbers based on dialSteps setting
 * 
 * Step logic (dialSteps = 4):
 *   4.0 → 4.1 → 4.2 → 4.3 → 4.4 → 5.0
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
  const clicksPerNumber = stepsPerNum + 1;
  const totalClicks = (maxVal - minVal) * clicksPerNumber;

  const drumRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startClickIndex: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    animationFrame: null
  });

  // Convert click index → value (e.g., 4.0, 4.1, ..., 4.4, 5.0)
  const clickIndexToValue = useCallback((clickIndex) => {
    const clamped = Math.max(0, Math.min(totalClicks, Math.round(clickIndex)));
    const major = minVal + Math.floor(clamped / clicksPerNumber);
    const subStep = clamped % clicksPerNumber;
    if (major >= maxVal) return parseFloat(maxVal.toFixed(1));
    return parseFloat((major + subStep * 0.1).toFixed(1));
  }, [minVal, maxVal, clicksPerNumber, totalClicks]);

  // Convert value → click index
  const valueToClickIndex = useCallback((val) => {
    let parsed = parseFloat(val);
    if (isNaN(parsed)) parsed = minVal;
    parsed = Math.max(minVal, Math.min(maxVal, parsed));
    const major = Math.floor(parsed);
    if (major >= maxVal) return totalClicks;
    const fraction = parsed - major;
    let subStep = Math.round(fraction * 10);
    if (subStep > stepsPerNum) subStep = stepsPerNum;
    return (major - minVal) * clicksPerNumber + subStep;
  }, [minVal, maxVal, stepsPerNum, clicksPerNumber, totalClicks]);

  const currentClickIndex = useMemo(() => valueToClickIndex(value), [value, valueToClickIndex]);
  const currentValue = useMemo(() => clickIndexToValue(currentClickIndex), [currentClickIndex, clickIndexToValue]);

  const { majorNumber, subStepIndex } = useMemo(() => {
    const major = Math.floor(currentValue);
    const sub = Math.round((currentValue - major) * 10);
    return { majorNumber: major, subStepIndex: sub };
  }, [currentValue]);

  // Stepper handlers
  const handleStepChange = (delta) => {
    if (disabled) return;
    const nextClick = Math.max(0, Math.min(totalClicks, currentClickIndex + delta));
    onChange(clickIndexToValue(nextClick));
  };

  // Generate ALL tick positions for the drum
  const drumTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= totalClicks; i++) {
      const major = minVal + Math.floor(i / clicksPerNumber);
      const sub = i % clicksPerNumber;
      const isMajor = sub === 0;
      const isMid = stepsPerNum >= 4 && sub === Math.ceil(stepsPerNum / 2);
      
      let label = null;
      if (isMajor) {
        label = String(major);
      }
      
      ticks.push({
        index: i,
        isMajor,
        isMid,
        label,
        value: clickIndexToValue(i)
      });
    }
    return ticks;
  }, [totalClicks, minVal, clicksPerNumber, stepsPerNum, clickIndexToValue]);

  // Pixel width per tick step on the drum
  const PX_PER_TICK = 18;
  const DRUM_VISIBLE_WIDTH = 320; // approximate visible viewport width

  // Calculate drum scroll offset so current click index is centered
  const drumOffset = useMemo(() => {
    return -(currentClickIndex * PX_PER_TICK) + DRUM_VISIBLE_WIDTH / 2;
  }, [currentClickIndex]);

  // Total drum content width
  const drumContentWidth = totalClicks * PX_PER_TICK;

  // 3D perspective: calculate opacity and scale for each tick based on distance from center
  const getTickStyle = useCallback((tickIndex) => {
    const distFromCenter = Math.abs(tickIndex - currentClickIndex);
    const maxVisibleTicks = DRUM_VISIBLE_WIDTH / PX_PER_TICK / 2;
    const normalizedDist = Math.min(distFromCenter / maxVisibleTicks, 1);
    
    // Cylindrical curvature: scale down and fade as distance increases
    const scale = 1 - normalizedDist * 0.35;
    const opacity = 1 - normalizedDist * 0.7;
    
    return { scale: Math.max(0.4, scale), opacity: Math.max(0.15, opacity) };
  }, [currentClickIndex]);

  // Touch/Mouse drag handling
  const getClientX = (e) => {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return e.clientX;
  };

  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const clientX = getClientX(e);
    
    if (dragState.current.animationFrame) {
      cancelAnimationFrame(dragState.current.animationFrame);
      dragState.current.animationFrame = null;
    }
    
    dragState.current = {
      ...dragState.current,
      isDragging: true,
      startX: clientX,
      startClickIndex: currentClickIndex,
      velocity: 0,
      lastX: clientX,
      lastTime: Date.now()
    };
  }, [disabled, currentClickIndex]);

  const handleDragMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();
    const clientX = getClientX(e);
    const deltaX = dragState.current.startX - clientX;
    const deltaTicks = deltaX / PX_PER_TICK;
    const newClickIndex = Math.max(0, Math.min(totalClicks, 
      Math.round(dragState.current.startClickIndex + deltaTicks)));
    
    // Track velocity for momentum
    const now = Date.now();
    const dt = now - dragState.current.lastTime;
    if (dt > 0) {
      dragState.current.velocity = (dragState.current.lastX - clientX) / dt;
    }
    dragState.current.lastX = clientX;
    dragState.current.lastTime = now;
    
    onChange(clickIndexToValue(newClickIndex));
  }, [totalClicks, clickIndexToValue, onChange]);

  const handleDragEnd = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;
    
    // Apply momentum
    const velocity = dragState.current.velocity;
    if (Math.abs(velocity) > 0.15) {
      const momentum = velocity * 120; // pixels of inertia
      const extraTicks = Math.round(momentum / PX_PER_TICK);
      const targetClick = Math.max(0, Math.min(totalClicks, currentClickIndex + extraTicks));
      
      // Animate to target with deceleration
      let progress = 0;
      const animate = () => {
        progress += 0.08;
        if (progress >= 1) {
          onChange(clickIndexToValue(targetClick));
          return;
        }
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const intermediateClick = Math.round(currentClickIndex + (targetClick - currentClickIndex) * eased);
        const clamped = Math.max(0, Math.min(totalClicks, intermediateClick));
        onChange(clickIndexToValue(clamped));
        dragState.current.animationFrame = requestAnimationFrame(animate);
      };
      dragState.current.animationFrame = requestAnimationFrame(animate);
    }
  }, [currentClickIndex, totalClicks, clickIndexToValue, onChange]);

  // Attach global listeners for drag
  useEffect(() => {
    const moveHandler = (e) => handleDragMove(e);
    const endHandler = (e) => handleDragEnd(e);
    
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('touchend', endHandler);
    
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', endHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', endHandler);
      if (dragState.current.animationFrame) {
        cancelAnimationFrame(dragState.current.animationFrame);
      }
    };
  }, [handleDragMove, handleDragEnd]);

  return (
    <div className="space-y-3">
      {/* Header Row: Badge + Readout */}
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

        {/* Digital readout */}
        <div className="flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-darkbg-card border border-coffee-200 dark:border-darkbg-border shadow-xs">
          <span className="text-xl font-black font-mono text-terracotta tracking-tight">
            {currentValue.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-coffee-500 dark:text-coffee-400 font-mono">
            {subStepIndex > 0 ? `(paso ${subStepIndex} de ${stepsPerNum})` : '(entero)'}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  3D CYLINDRICAL DRUM DIAL                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative select-none" style={{ touchAction: 'none' }}>
        
        {/* Metallic housing frame */}
        <div 
          style={{
            background: 'linear-gradient(180deg, #2a2520 0%, #1a1612 35%, #0f0d0b 100%)',
            borderRadius: '20px',
            padding: '2px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          {/* Inner bezel */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1e1a16 0%, #141210 50%, #1e1a16 100%)',
              borderRadius: '18px',
              padding: '3px 0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top metallic highlight line */}
            <div style={{
              position: 'absolute',
              top: 0, left: '10%', right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)',
              zIndex: 20
            }} />

            {/* Fixed Indicator Arrow at top center */}
            <div style={{
              position: 'absolute',
              top: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '10px solid #d9534f',
                filter: 'drop-shadow(0 0 6px rgba(217, 83, 79, 0.8))'
              }} />
              <div style={{
                width: '2px',
                height: '100%',
                minHeight: '110px',
                background: 'linear-gradient(180deg, #d9534f 0%, rgba(217,83,79,0.1) 100%)',
                position: 'absolute',
                top: '10px'
              }} />
            </div>

            {/* ── The Drum Surface ── */}
            <div
              ref={drumRef}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              style={{
                height: '120px',
                cursor: disabled ? 'default' : 'grab',
                position: 'relative',
                overflow: 'hidden',
                // 3D cylindrical perspective
                perspective: '600px',
                perspectiveOrigin: '50% 50%'
              }}
            >
              {/* Cylindrical curvature overlay — top shadow */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '30%',
                background: 'linear-gradient(180deg, rgba(10,8,6,0.85) 0%, transparent 100%)',
                zIndex: 15,
                pointerEvents: 'none',
                borderRadius: '18px 18px 0 0'
              }} />
              {/* Cylindrical curvature overlay — bottom shadow */}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '30%',
                background: 'linear-gradient(0deg, rgba(10,8,6,0.85) 0%, transparent 100%)',
                zIndex: 15,
                pointerEvents: 'none',
                borderRadius: '0 0 18px 18px'
              }} />
              {/* Left fade */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0,
                width: '60px',
                background: 'linear-gradient(90deg, rgba(14,12,10,0.95) 0%, transparent 100%)',
                zIndex: 16,
                pointerEvents: 'none'
              }} />
              {/* Right fade */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0, right: 0,
                width: '60px',
                background: 'linear-gradient(270deg, rgba(14,12,10,0.95) 0%, transparent 100%)',
                zIndex: 16,
                pointerEvents: 'none'
              }} />

              {/* Brushed metal texture background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                  repeating-linear-gradient(
                    90deg,
                    rgba(255,255,255,0.008) 0px,
                    rgba(255,255,255,0.015) 1px,
                    transparent 1px,
                    transparent 3px
                  ),
                  radial-gradient(ellipse at 50% 50%, #1c1916 0%, #0e0c0a 100%)
                `,
                borderRadius: '16px'
              }} />

              {/* Tick marks container — slides horizontally */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${drumContentWidth + DRUM_VISIBLE_WIDTH}px`,
                  transform: `translateX(${drumOffset}px)`,
                  transition: dragState.current.isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {drumTicks.map((tick) => {
                  const { scale, opacity } = getTickStyle(tick.index);
                  const isSelected = tick.index === currentClickIndex;
                  
                  return (
                    <div
                      key={tick.index}
                      style={{
                        position: 'absolute',
                        left: `${tick.index * PX_PER_TICK}px`,
                        width: `${PX_PER_TICK}px`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `scaleY(${scale})`,
                        opacity,
                        transition: dragState.current.isDragging ? 'none' : 'transform 0.15s ease, opacity 0.15s ease'
                      }}
                    >
                      {/* Major number label (above tick) */}
                      {tick.isMajor && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '14px',
                            fontFamily: "'SF Mono', 'Roboto Mono', 'Fira Code', monospace",
                            fontSize: isSelected ? '18px' : '14px',
                            fontWeight: isSelected ? 900 : 600,
                            color: isSelected ? '#d4af37' : 'rgba(180, 160, 130, 0.7)',
                            textShadow: isSelected ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                            letterSpacing: '-0.5px',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                        >
                          {tick.label}
                        </span>
                      )}

                      {/* Tick line */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: tick.isMajor ? '16px' : '24px',
                          width: tick.isMajor ? '2px' : tick.isMid ? '1.5px' : '1px',
                          height: tick.isMajor ? '36px' : tick.isMid ? '22px' : '14px',
                          background: tick.isMajor
                            ? (isSelected 
                              ? 'linear-gradient(180deg, #d4af37 0%, rgba(212,175,55,0.4) 100%)' 
                              : 'linear-gradient(180deg, rgba(180,160,130,0.8) 0%, rgba(180,160,130,0.2) 100%)')
                            : tick.isMid
                            ? 'linear-gradient(180deg, rgba(150,135,110,0.6) 0%, rgba(150,135,110,0.15) 100%)'
                            : 'linear-gradient(180deg, rgba(120,110,90,0.45) 0%, rgba(120,110,90,0.1) 100%)',
                          borderRadius: '1px',
                          boxShadow: isSelected && tick.isMajor ? '0 0 8px rgba(212,175,55,0.4)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      />

                      {/* Sub-step number for non-zero substeps on major ticks */}
                      {tick.isMajor && !isSelected && tick.index > 0 && tick.index < totalClicks && (
                        <span style={{
                          position: 'absolute',
                          bottom: '4px',
                          fontSize: '8px',
                          fontFamily: "'SF Mono', monospace",
                          color: 'rgba(140,125,100,0.3)',
                          userSelect: 'none'
                        }}>
                          .0
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Center highlight glow (where indicator points) */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '40px',
                height: '100%',
                background: 'radial-gradient(ellipse at center, rgba(217,83,79,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 14
              }} />
            </div>

            {/* Bottom metallic highlight */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: '10%', right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(180,160,130,0.15), transparent)',
              zIndex: 20
            }} />
          </div>
        </div>

        {/* Knurling texture strips (top and bottom of housing) */}
        <div style={{
          position: 'absolute',
          top: '-3px', left: '15%', right: '15%',
          height: '3px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 4px)',
          borderRadius: '2px 2px 0 0'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-3px', left: '15%', right: '15%',
          height: '3px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 4px)',
          borderRadius: '0 0 2px 2px'
        }} />
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STEPPER CONTROLS                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
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

        {/* Position display */}
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

      {/* Range extents legend */}
      <div className="flex justify-between items-center text-[10px] text-coffee-500 dark:text-coffee-400 font-mono px-1">
        <span>Min: {minVal.toFixed(1)}</span>
        <span className="text-[10px] font-semibold text-terracotta">
          Escala: {minVal}, {minVal}.1... {minVal}.{stepsPerNum} → {minVal + 1}
        </span>
        <span>Max: {maxVal.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default DialSlider;
