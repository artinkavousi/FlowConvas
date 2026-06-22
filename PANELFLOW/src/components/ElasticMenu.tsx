import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const ICON_DATA = [
  { id: 'cool', emoji: '😎', label: 'COOL' },
  { id: 'evil', emoji: '😈', label: 'EVIL' },
  { id: 'confused', emoji: '😕', label: 'CONFUSED' },
  { id: 'sad', emoji: '😢', label: 'SAD' },
  { id: 'shocked', emoji: '😱', label: 'SHOCKED' },
  { id: 'smile', emoji: '🙂', label: 'SMILE' },
  { id: 'wondering', emoji: '🤔', label: 'WONDERING' },
  { id: 'happy', emoji: '😄', label: 'HAPPY' },
  { id: 'angry', emoji: '😡', label: 'ANGRY' },
  { id: 'baffled', emoji: '😧', label: 'BAFFLED' },
  { id: 'sleepy', emoji: '😴', label: 'SLEEPY' },
  { id: 'tongue', emoji: '😛', label: 'TONGUE' },
  { id: 'grin', emoji: '😁', label: 'GRIN' },
  { id: 'neutral', emoji: '😐', label: 'NEUTRAL' }
];

const SPACER = 60;
const MIN_RADIUS = 10;
const MAX_RADIUS = 48;
const DRAG_WIDTH = (ICON_DATA.length - 1) * SPACER;

const MenuDot = ({ index, dragX, color }: { index: number; dragX: any; color: string }) => {
  const cx = index * SPACER;
  const distance = useTransform(dragX, (val) => Math.abs((val as number) + cx));
  const progress = useTransform(distance, [0, 120], [1, 0], { clamp: true });
  const r = useTransform(progress, (p) => MIN_RADIUS + p * (MAX_RADIUS - MIN_RADIUS));

  return <motion.circle cx={cx} cy={0} r={r} fill={color} />;
};

const MenuIcon = ({ index, dragX }: { index: number; dragX: any }) => {
  const cx = index * SPACER;
  const distance = useTransform(dragX, (val) => Math.abs((val as number) + cx));
  const progress = useTransform(distance, [0, 120], [1, 0], { clamp: true });
  const iconScale = useTransform(progress, (p) => Math.max(0, p * 2.2));
  const iconOpacity = useTransform(progress, (p) => Math.max(0, Math.min(1, p * 1.5)));
  
  return (
    <motion.g style={{ x: cx, y: 0, scale: iconScale, opacity: iconOpacity }}>
      <text y={2} textAnchor="middle" dominantBaseline="central" fontSize={24} pointerEvents="none">
        {ICON_DATA[index].emoji}
      </text>
    </motion.g>
  );
};

export function ElasticMenu({
  className = "",
  uiColor = "#FF5EAE",
}: {
  className?: string;
  uiColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [oldIndex, setOldIndex] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setContainerWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleDragEnd = (e: any, info: any) => {
    setIsDragging(false);
    const currentX = x.get();
    const targetX = Math.max(-DRAG_WIDTH, Math.min(0, currentX + info.velocity.x * 0.2));
    const closest = Math.round(-targetX / SPACER);
    
    setOldIndex(selectedIndex);
    setSelectedIndex(closest);
    animate(x, -closest * SPACER, { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25, 
      velocity: info.velocity.x 
    });
  };

  const handleClickDot = (idx: number) => {
    if (isDragging) return;
    setOldIndex(selectedIndex);
    setSelectedIndex(idx);
    animate(x, -idx * SPACER, { type: 'spring', stiffness: 300, damping: 25 });
  };

  const direction = oldIndex < selectedIndex ? 45 : -45;

  return (
    <div className={`relative w-full h-[220px] overflow-hidden select-none touch-none bg-[#0c0c0c] ${className}`} ref={containerRef}>
      <svg width="100%" height="100%">
        <defs>
          <filter id="goo-menu">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="cm" />
          </filter>
        </defs>

        {containerWidth > 0 && (
          <g transform={`translate(${containerWidth / 2}, 160)`}>
            <motion.g 
              style={{ x }}
              drag="x"
              dragConstraints={{ left: -DRAG_WIDTH, right: 0 }}
              dragElastic={0.05}
              dragMomentum={false} 
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="cursor-pointer"
            >
              {/* Hit Area */}
              <rect x={-MAX_RADIUS*1.5} y={-MAX_RADIUS*1.5} width={DRAG_WIDTH + MAX_RADIUS*3} height={MAX_RADIUS*3} fill="transparent" />

              {/* Gooey Layer */}
              <g filter="url(#goo-menu)">
                {/* Connecting Line */}
                <line x1={0} y1={0} x2={DRAG_WIDTH} y2={0} stroke={uiColor} strokeWidth={MIN_RADIUS * 2} strokeLinecap="round" />
                
                {/* Dots */}
                {ICON_DATA.map((_, i) => (
                  <MenuDot key={`dot-${i}`} index={i} dragX={x} color={uiColor} />
                ))}
              </g>

              {/* Individual Click Targets */}
              {ICON_DATA.map((_, i) => (
                <circle 
                  key={`click-${i}`} 
                  cx={i * SPACER} 
                  cy={0} 
                  r={MAX_RADIUS} 
                  fill="transparent" 
                  onClick={() => handleClickDot(i)} 
                />
              ))}

              {/* Icons */}
              {ICON_DATA.map((_, i) => (
                <MenuIcon key={`icon-${i}`} index={i} dragX={x} />
              ))}

              {/* Speech Bubble */}
              <motion.g
                initial={false}
                animate={{
                  x: selectedIndex * SPACER,
                  y: isDragging ? -60 : -100,
                  scale: isDragging ? 0 : 1,
                  opacity: isDragging ? 0 : 1,
                  rotate: isDragging ? direction : 0, 
                }}
                transition={{
                  type: 'spring', stiffness: 450, damping: 25
                }}
              >
                <path 
                  d="M-40,-55 L40,-55 A10,10 0 0,1 50,-45 L50,-25 A10,10 0 0,1 40,-15 L15,-15 L0,0 L-15,-15 L-40,-15 A10,10 0 0,1 -50,-25 L-50,-45 A10,10 0 0,1 -40,-55 Z" 
                  fill="#fff" 
                  stroke={uiColor} 
                  strokeWidth={2}
                />
                <text y="-30" textAnchor="middle" fill={uiColor} fontSize={12} fontWeight="bold" letterSpacing="1">
                  {ICON_DATA[selectedIndex]?.label}
                </text>
              </motion.g>

            </motion.g>
          </g>
        )}
      </svg>
    </div>
  );
}
