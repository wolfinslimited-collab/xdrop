import { motion } from 'framer-motion';
import mascotImg from '@/assets/openclaw-mascot.png';

export default function OpenClawMascot({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-32 h-32' : 'w-8 h-8';
  const glowSize = size === 'lg' ? '30px' : '10px';

  return (
    <motion.div
      className={`relative ${dim} mx-auto`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(220,80,60,0.35) 0%, rgba(220,80,60,0) 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Mascot image with subtle bounce */}
      <motion.img
        src={mascotImg}
        alt="OpenClaw"
        className={`${dim} rounded-2xl relative z-10 object-cover`}
        style={{
          filter: `drop-shadow(0 0 ${glowSize} rgba(220,80,60,0.5))`,
        }}
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{
          scale: 1.08,
          filter: `drop-shadow(0 0 ${glowSize} rgba(220,80,60,0.8))`,
        }}
      />

      {/* Sparkle particles */}
      {size === 'lg' && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-red-400/60"
              style={{
                top: `${20 + i * 25}%`,
                left: `${10 + i * 35}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -12, -20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}
