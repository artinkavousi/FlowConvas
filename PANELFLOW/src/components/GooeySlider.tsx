import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/cn';

interface GooeySliderProps {
  value: number;
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  color?: string; // Optional custom color for the blob (defaults to theme white/accent)
  textColor?: string; 
}

export function GooeySlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100,
  step = 1,
  className = "",
  color = "#fff",
  textColor = "#000"
}: GooeySliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(0);

  // Framer motion values
  const x = useMotionValue(0);
  
  // Create an elastic trailing effect for the balloon
  const balloonX = useSpring(x, { stiffness: 150, damping: 10, mass: 1 });
  const textX = useSpring(x, { stiffness: 150, damping: 10, mass: 1 });

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Update position if value changes externally, BUT don't interrupt dragging
  useEffect(() => {
    if (!isDragging && width > 0) {
      const percent = Math.max(0, Math.min(1, (value - min) / (max - min)));
      const newX = percent * width;
      x.set(newX);
    }
  }, [value, min, max, width, isDragging, x]);

  const handleDrag = (event: any, info: any) => {
    if (width === 0) return;
    const boundedX = Math.max(0, Math.min(x.get(), width));
    const percent = boundedX / width;
    let val = min + percent * (max - min);
    if (step) {
      val = Math.round(val / step) * step;
    }
    onChange?.(val);
  };

  const currentDisplayValue = useTransform(x, (currentX) => {
    if (width === 0) return min;
    const boundedX = Math.max(0, Math.min(currentX, width));
    const percent = boundedX / width;
    let val = min + percent * (max - min);
    if (step) val = Math.round(val / step) * step;
    return val;
  });

  const [displayNumber, setDisplayNumber] = useState(value);
  useEffect(() => {
    return currentDisplayValue.on("change", (v) => {
      setDisplayNumber(v);
    });
  }, [currentDisplayValue]);

  return (
    <div className={cn("relative flex items-center h-16 w-full touch-none", className)} ref={containerRef}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="cm" />
          </filter>
        </defs>
      </svg>
      
      {/* Background Track */}
      <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/10" />
      <motion.div 
        className="absolute left-0 h-[3px] rounded-full"
        style={{ width: x, background: color, opacity: 0.5 }}
      />
      
      {/* Goo filter container */}
      <div className="absolute inset-x-0 inset-y-[-50px] pointer-events-none" style={{ filter: 'url(#goo)' }}>
        
        {/* The Balloon */}
        <motion.div
           className="absolute top-1/2 -ml-6 rounded-full"
           initial={false}
           animate={{
             y: isDragging ? -45 : 0,
             width: isDragging ? 48 : 32,
             height: isDragging ? 48 : 32,
             marginTop: isDragging ? -24 : -16,
           }}
           transition={{
             type: 'spring',
             stiffness: 300,
             damping: 18
           }}
           style={{ 
             x: balloonX,
             background: color
           }}
        />

        {/* The Handle / Dragger (solid dot getting smaller) */}
        <motion.div
           className="absolute top-1/2 -ml-4 rounded-full"
           initial={false}
           animate={{
             width: isDragging ? 12 : 32,
             height: isDragging ? 12 : 32,
             marginTop: isDragging ? -6 : -16,
           }}
           transition={{
             type: 'spring',
             stiffness: 300,
             damping: 20
           }}
           style={{ x, background: color }}
        />
      </div>

      {/* Texts Container (outside gooey filter to prevent blurring text) */}
       <div className="absolute inset-x-0 inset-y-[-50px] pointer-events-none drop-shadow-sm">
          {/* Balloon Text */}
          <motion.div
             className="absolute top-1/2 flex items-center justify-center font-bold text-[18px] -ml-6 tracking-tight"
             initial={false}
             animate={{
               y: isDragging ? -45 : 0,
               opacity: isDragging ? 1 : 0,
               width: 48,
               height: 48,
               marginTop: -24
             }}
             transition={{
               opacity: { duration: 0.2 },
               y: { type: 'spring', stiffness: 300, damping: 18 }
             }}
             style={{ x: textX, color: textColor }}
          >
            {displayNumber}
          </motion.div>

          {/* Dragger Text */}
          <motion.div
             className="absolute top-1/2 flex items-center justify-center text-xs font-bold -ml-4"
             initial={false}
             animate={{
               opacity: isDragging ? 0 : 1,
               width: 32,
               height: 32,
               marginTop: -16
             }}
             transition={{ duration: 0.2 }}
             style={{ x, color: textColor }}
          >
            {displayNumber}
          </motion.div>
       </div>

      {/* Invisible actual drag handle overlay */}
      <motion.div
        className="absolute top-1/2 -ml-5 w-10 h-10 mt-[-20px] rounded-full cursor-grab active:cursor-grabbing hover:bg-white/5"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onDrag={handleDrag}
      />
    </div>
  );
}
