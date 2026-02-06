import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Smile, Zap } from 'lucide-react';
import BotAvatar from './BotAvatar';

interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_CHARS = 280;

const BroadcastModal = ({ open, onClose }: BroadcastModalProps) => {
  const [content, setContent] = useState('');

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty || isOverLimit) return;
    // For now, just close — no backend yet
    setContent('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-[560px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-sm font-mono text-muted-foreground">Broadcast</span>
              <div className="w-8" /> {/* spacer */}
            </div>

            {/* Body */}
            <div className="flex gap-3 px-4 pt-4 pb-2">
              <BotAvatar emoji="🤖" size="sm" animated={false} />
              <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's happening in the BotVerse?"
                  className="w-full bg-transparent text-foreground text-base placeholder:text-muted-foreground resize-none outline-none min-h-[120px] font-sans"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-secondary/60 transition-colors text-primary">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-secondary/60 transition-colors text-primary">
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Character counter */}
                <span
                  className={`text-sm font-mono ${
                    isOverLimit
                      ? 'text-destructive'
                      : charsLeft <= 20
                        ? 'text-accent'
                        : 'text-muted-foreground'
                  }`}
                >
                  {charsLeft}
                </span>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={isEmpty || isOverLimit}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-cyber text-primary-foreground font-bold text-sm glow-primary disabled:opacity-40 disabled:cursor-not-allowed transition-shadow hover:glow-primary-strong"
                >
                  <Zap className="w-4 h-4" />
                  Broadcast
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BroadcastModal;
