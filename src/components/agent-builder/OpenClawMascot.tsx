import { motion } from 'framer-motion';

export default function OpenClawMascot({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 1 : 0.3;

  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 130 * s, height: 150 * s }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, rgba(195,75,65,0.35) 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Body group with float */}
      <motion.div
        className="relative"
        style={{ width: 130 * s, height: 150 * s }}
        animate={{ y: [0, -4 * s, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
      >
        {/* Legs — shorter, stubbier, wider apart */}
        <div className="absolute flex" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', gap: 14 * s }}>
          <div style={{ width: 12 * s, height: 16 * s, background: '#BE5B53', borderRadius: `${3 * s}px ${3 * s}px ${5 * s}px ${5 * s}px` }} />
          <div style={{ width: 12 * s, height: 16 * s, background: '#BE5B53', borderRadius: `${3 * s}px ${3 * s}px ${5 * s}px ${5 * s}px` }} />
        </div>

        {/* Main body — wider, more egg/oval shaped */}
        <div
          className="absolute"
          style={{
            width: 100 * s,
            height: 108 * s,
            background: 'radial-gradient(ellipse at 48% 38%, #CD6D65 0%, #C0605A 40%, #B5524C 75%, #A84A44 100%)',
            borderRadius: '48% 48% 45% 45% / 45% 45% 50% 50%',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 16 * s,
          }}
        />

        {/* Left arm — rounder, positioned mid-body */}
        <div
          className="absolute"
          style={{
            width: 26 * s,
            height: 28 * s,
            background: 'radial-gradient(ellipse at 45% 40%, #CD6D65, #B5524C)',
            borderRadius: '50%',
            left: 0,
            top: 58 * s,
          }}
        />

        {/* Right arm */}
        <div
          className="absolute"
          style={{
            width: 26 * s,
            height: 28 * s,
            background: 'radial-gradient(ellipse at 55% 40%, #CD6D65, #B5524C)',
            borderRadius: '50%',
            right: 0,
            top: 58 * s,
          }}
        />

        {/* Left antenna — curved, thinner */}
        <div
          className="absolute"
          style={{
            width: 2.5 * s,
            height: 22 * s,
            background: '#C0605A',
            left: 46 * s,
            top: 2 * s,
            transform: 'rotate(-20deg)',
            borderRadius: `${2 * s}px ${2 * s}px ${1 * s}px ${1 * s}px`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Right antenna */}
        <div
          className="absolute"
          style={{
            width: 2.5 * s,
            height: 22 * s,
            background: '#C0605A',
            right: 46 * s,
            top: 2 * s,
            transform: 'rotate(20deg)',
            borderRadius: `${2 * s}px ${2 * s}px ${1 * s}px ${1 * s}px`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Left eye — larger, more prominent with teal glow */}
        <motion.div
          className="absolute"
          style={{
            width: 18 * s,
            height: 18 * s,
            background: 'radial-gradient(circle at 35% 35%, #3EEBD4, #1A3B36 70%, #0F2220)',
            borderRadius: '50%',
            left: 37 * s,
            top: 50 * s,
            boxShadow: `0 0 ${8 * s}px rgba(62,235,212,0.4)`,
          }}
          animate={{
            boxShadow: [
              `0 0 ${6 * s}px rgba(62,235,212,0.3)`,
              `0 0 ${12 * s}px rgba(62,235,212,0.6)`,
              `0 0 ${6 * s}px rgba(62,235,212,0.3)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Right eye */}
        <motion.div
          className="absolute"
          style={{
            width: 18 * s,
            height: 18 * s,
            background: 'radial-gradient(circle at 35% 35%, #3EEBD4, #1A3B36 70%, #0F2220)',
            borderRadius: '50%',
            right: 37 * s,
            top: 50 * s,
            boxShadow: `0 0 ${8 * s}px rgba(62,235,212,0.4)`,
          }}
          animate={{
            boxShadow: [
              `0 0 ${6 * s}px rgba(62,235,212,0.3)`,
              `0 0 ${12 * s}px rgba(62,235,212,0.6)`,
              `0 0 ${6 * s}px rgba(62,235,212,0.3)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Eye pupils — dark, slightly off-center for character */}
        <div className="absolute" style={{ width: 7 * s, height: 7 * s, background: '#111', borderRadius: '50%', left: 42 * s, top: 54 * s }} />
        <div className="absolute" style={{ width: 7 * s, height: 7 * s, background: '#111', borderRadius: '50%', right: 42 * s, top: 54 * s }} />

        {/* Eye highlights — small white dots */}
        <div className="absolute" style={{ width: 3 * s, height: 3 * s, background: 'rgba(255,255,255,0.7)', borderRadius: '50%', left: 41 * s, top: 52 * s }} />
        <div className="absolute" style={{ width: 3 * s, height: 3 * s, background: 'rgba(255,255,255,0.7)', borderRadius: '50%', right: 41 * s, top: 52 * s }} />
      </motion.div>

      {/* Sparkle particles */}
      {size === 'lg' && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ background: 'rgba(195,75,65,0.5)', top: `${20 + i * 25}%`, left: `${10 + i * 35}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -12, -20] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}
