import { motion } from 'framer-motion';

export default function OpenClawMascot({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 1 : 0.3;

  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 120 * s, height: 140 * s }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, rgba(205,75,65,0.4) 0%, transparent 70%)',
          filter: 'blur(10px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Body group with float */}
      <motion.div
        className="relative"
        style={{ width: 120 * s, height: 140 * s }}
        animate={{ y: [0, -4 * s, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
      >
        {/* Legs */}
        <div className="absolute flex gap-1" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 10 * s, height: 18 * s, background: '#C65B52', borderRadius: `0 0 ${4 * s}px ${4 * s}px` }} />
          <div style={{ width: 6 * s }} />
          <div style={{ width: 10 * s, height: 18 * s, background: '#C65B52', borderRadius: `0 0 ${4 * s}px ${4 * s}px` }} />
        </div>

        {/* Main body */}
        <div
          className="absolute"
          style={{
            width: 90 * s,
            height: 100 * s,
            background: 'radial-gradient(ellipse at 45% 35%, #D4726A 0%, #C65B52 50%, #B04A42 100%)',
            borderRadius: '50%',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 18 * s,
          }}
        />

        {/* Left arm */}
        <div
          className="absolute"
          style={{
            width: 22 * s,
            height: 26 * s,
            background: 'radial-gradient(ellipse at 40% 40%, #D4726A, #B85A52)',
            borderRadius: '50%',
            left: 4 * s,
            top: 55 * s,
          }}
        />

        {/* Right arm */}
        <div
          className="absolute"
          style={{
            width: 22 * s,
            height: 26 * s,
            background: 'radial-gradient(ellipse at 60% 40%, #D4726A, #B85A52)',
            borderRadius: '50%',
            right: 4 * s,
            top: 55 * s,
          }}
        />

        {/* Left antenna */}
        <div
          className="absolute"
          style={{
            width: 2 * s,
            height: 20 * s,
            background: '#C65B52',
            left: 42 * s,
            top: 4 * s,
            transform: 'rotate(-15deg)',
            borderRadius: 2 * s,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Right antenna */}
        <div
          className="absolute"
          style={{
            width: 2 * s,
            height: 20 * s,
            background: '#C65B52',
            right: 42 * s,
            top: 4 * s,
            transform: 'rotate(15deg)',
            borderRadius: 2 * s,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Left eye */}
        <motion.div
          className="absolute"
          style={{
            width: 14 * s,
            height: 14 * s,
            background: 'radial-gradient(circle at 40% 40%, #2DD4BF, #0D1B1A)',
            borderRadius: '50%',
            left: 38 * s,
            top: 50 * s,
            boxShadow: `0 0 ${6 * s}px rgba(45,212,191,0.5)`,
          }}
          animate={{ boxShadow: [`0 0 ${6 * s}px rgba(45,212,191,0.3)`, `0 0 ${10 * s}px rgba(45,212,191,0.7)`, `0 0 ${6 * s}px rgba(45,212,191,0.3)`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Right eye */}
        <motion.div
          className="absolute"
          style={{
            width: 14 * s,
            height: 14 * s,
            background: 'radial-gradient(circle at 40% 40%, #2DD4BF, #0D1B1A)',
            borderRadius: '50%',
            right: 38 * s,
            top: 50 * s,
            boxShadow: `0 0 ${6 * s}px rgba(45,212,191,0.5)`,
          }}
          animate={{ boxShadow: [`0 0 ${6 * s}px rgba(45,212,191,0.3)`, `0 0 ${10 * s}px rgba(45,212,191,0.7)`, `0 0 ${6 * s}px rgba(45,212,191,0.3)`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Eye pupils */}
        <div className="absolute" style={{ width: 5 * s, height: 5 * s, background: '#111', borderRadius: '50%', left: 42.5 * s, top: 53 * s }} />
        <div className="absolute" style={{ width: 5 * s, height: 5 * s, background: '#111', borderRadius: '50%', right: 42.5 * s, top: 53 * s }} />
      </motion.div>

      {/* Sparkle particles */}
      {size === 'lg' && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ background: 'rgba(205,75,65,0.6)', top: `${20 + i * 25}%`, left: `${10 + i * 35}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -12, -20] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}
