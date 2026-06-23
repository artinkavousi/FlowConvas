import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/cn';

const EMOJIS = ['😡', '😟', '😐', '🙂', '😄'];

export interface BubbleRatingSliderProps {
  value: number;
  onChange?: (val: number) => void;
  className?: string;
  color?: string;
}

export function BubbleRatingSlider({ 
  value, 
  onChange, 
  className = "",
  color = "#F59E0B",
}: BubbleRatingSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(0);

  const x = useMotionValue(0);
  const bubbleX = useSpring(x, { stiffness: 300, damping: 20, mass: 1 });
  const textX = useSpring(x, { stiffness: 300, damping: 20, mass: 1 });

  const steps = EMOJIS.length;

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!isDragging && width > 0) {
      const stepWidth = width / (steps - 1);
      x.set(value * stepWidth);
    }
  }, [value, width, isDragging, steps, x]);

  const handleDrag = () => {
    if (width === 0) return;
    const boundedX = Math.max(0, Math.min(x.get(), width));
    const stepWidth = width / (steps - 1);
    const closestStep = Math.round(boundedX / stepWidth);
    onChange?.(closestStep);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (width === 0) return;
    const boundedX = Math.max(0, Math.min(x.get(), width));
    const stepWidth = width / (steps - 1);
    const closestStep = Math.round(boundedX / stepWidth);
    x.set(closestStep * stepWidth);
    onChange?.(closestStep);
  };

  const currentDisplayValue = useTransform(x, (currentX) => {
    if (width === 0) return value;
    const boundedX = Math.max(0, Math.min(currentX, width));
    const stepWidth = width / (steps - 1);
    return Math.round(boundedX / stepWidth);
  });

  const [displayIndex, setDisplayIndex] = useState(value);
  useEffect(() => {
    return currentDisplayValue.on("change", (v) => {
      setDisplayIndex(v);
    });
  }, [currentDisplayValue]);

  return (
    <div className={cn("relative flex items-center h-20 w-full touch-none", className)} ref={containerRef}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="goo-bubble">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="cm" />
          </filter>
        </defs>
      </svg>
      
      {/* Background Track with Step Dots */}
      <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/10" />
      <div className="absolute left-0 right-0 flex justify-between" style={{ padding: '0 0px' }}>
         {EMOJIS.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20 -mt-[1.5px]" style={{ transform: 'translateX(-50%)', marginLeft: i === 0 ? '3px' : i === steps - 1 ? '-3px' : '0' }} />
         ))}
      </div>
      
      <motion.div 
        className="absolute left-0 h-[3px] rounded-full"
        style={{ width: x, background: color, opacity: 0.5 }}
      />
      
      {/* Goo filter container */}
      <div className="absolute inset-x-0 inset-y-[-60px] pointer-events-none" style={{ filter: 'url(#goo-bubble)' }}>
        
        {/* The Bubble Parent */}
        <motion.div
           className="absolute top-1/2 -ml-[24px] rounded-full"
           initial={false}
           animate={{
             y: isDragging ? -55 : 0,
             width: isDragging ? 48 : 32,
             height: isDragging ? 48 : 32,
             marginTop: isDragging ? -24 : -16,
             marginLeft: isDragging ? -24 : -16,
           }}
           transition={{
             type: 'spring',
             stiffness: 400,
             damping: 25
           }}
           style={{ x: bubbleX, background: color }}
        />

        {/* The Handle */}
        <motion.div
           className="absolute top-1/2 -ml-[15px] rounded-full"
           initial={false}
           animate={{
             width: isDragging ? 16 : 30,
             height: isDragging ? 16 : 30,
             marginTop: isDragging ? -8 : -15,
             marginLeft: isDragging ? -8 : -15,
           }}
           transition={{
             type: 'spring',
             stiffness: 400,
             damping: 25
           }}
           style={{ x, background: color }}
        />
      </div>

      {/* Texts Container */}
       <div className="absolute inset-x-0 inset-y-[-60px] pointer-events-none drop-shadow-md">
          {/* Bubble Text (Emoji) */}
          <motion.div
             className="absolute top-1/2 flex flex-col items-center justify-center -ml-[24px]"
             initial={false}
             animate={{
               y: isDragging ? -55 : 0,
               opacity: isDragging ? 1 : 0,
               scale: isDragging ? 1 : 0.5,
               width: 48,
               height: 48,
               marginTop: -24
             }}
             transition={{
               opacity: { duration: 0.2 },
               scale: { type: 'spring', stiffness: 400, damping: 25 },
               y: { type: 'spring', stiffness: 400, damping: 25 }
             }}
             style={{ x: textX }}
          >
            <span className="text-2xl leading-none">{EMOJIS[displayIndex ?? 0]}</span>
          </motion.div>

          {/* Dragger Text */}
          <motion.div
             className="absolute top-1/2 flex items-center justify-center -ml-[16px]"
             initial={false}
             animate={{
               opacity: isDragging ? 0 : 1,
               scale: isDragging ? 0.5 : 1,
               width: 32,
               height: 32,
               marginTop: -16
             }}
             transition={{ duration: 0.2 }}
             style={{ x }}
          >
             <span className="text-sm leading-none opacity-90">{EMOJIS[displayIndex ?? 0]}</span>
          </motion.div>
       </div>

      {/* Drag handle */}
      <motion.div
        className="absolute top-1/2 -ml-[20px] w-10 h-10 mt-[-20px] rounded-full cursor-grab active:cursor-grabbing hover:bg-white/5 z-10"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
      />
    </div>
  );
}
