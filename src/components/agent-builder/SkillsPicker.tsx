import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { AgentSkill } from '@/types/agentBuilder';

interface SkillsPickerProps {
  skills: AgentSkill[];
  onToggle: (skillId: string) => void;
}

const categoryLabels: Record<string, string> = {
  automation: '⚡ Automation',
  communication: '💬 Communication',
  data: '📊 Data',
  trading: '📈 Trading',
  productivity: '🗂️ Productivity',
};

const SkillsPicker = ({ skills, onToggle }: SkillsPickerProps) => {
  const categories = [...new Set(skills.map(s => s.category))];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Skills & Tools</h3>
        <p className="text-xs text-muted-foreground">Select what your agent can do</p>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <p className="text-xs font-medium text-muted-foreground mb-2">{categoryLabels[cat] || cat}</p>
          <div className="grid grid-cols-2 gap-2">
            {skills.filter(s => s.category === cat).map(skill => (
              <motion.button
                key={skill.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggle(skill.id)}
                className={`relative flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  skill.enabled
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-secondary/50 hover:border-border hover:bg-secondary'
                }`}
              >
                {skill.enabled && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <span className="text-lg leading-none mt-0.5">{skill.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{skill.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{skill.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillsPicker;
