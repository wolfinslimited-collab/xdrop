import { motion } from 'framer-motion';
import { Bot, ArrowRight, Zap, Shield, Radio, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AgentConfig, AgentSkill } from '@/types/agentBuilder';

interface WorkflowGraphProps {
  config: AgentConfig;
  onReorderSkills?: (skills: AgentSkill[]) => void;
}

const WorkflowGraph = ({ config, onReorderSkills }: WorkflowGraphProps) => {
  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);
  const activeTrigger = config.triggers.find(t => t.enabled)?.type || 'manual';
  const hasGuardrails = config.guardrails.maxSpendPerRun > 0 || config.guardrails.requireApproval;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSkills) return;

    const oldIndex = enabledSkills.findIndex(s => s.id === active.id);
    const newIndex = enabledSkills.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedEnabled = arrayMove(enabledSkills, oldIndex, newIndex);
    const disabledSkills = config.skills.filter(s => !s.enabled);
    onReorderSkills([...reorderedEnabled, ...disabledSkills]);
  };

  if (enabledSkills.length === 0 && connectedIntegrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-12">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Zap className="w-5 h-5" />
        </div>
        <p className="text-sm text-center max-w-[220px]">
          Enable skills & integrations to see your agent's workflow
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-start gap-2 min-w-max px-2">
        {/* Trigger */}
        <StaticNode
          icon={<Radio className="w-3.5 h-3.5" />}
          label={activeTrigger.charAt(0).toUpperCase() + activeTrigger.slice(1)}
          sublabel="Trigger"
          color="accent"
          delay={0}
        />

        {enabledSkills.length > 0 && <Connector delay={0.1} />}

        {/* Sortable skills */}
        {enabledSkills.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={enabledSkills.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {enabledSkills.map((skill, i) => (
                  <SortableSkillNode key={skill.id} skill={skill} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {connectedIntegrations.length > 0 && <Connector delay={0.25} />}

        {/* Integrations */}
        {connectedIntegrations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {connectedIntegrations.map((integ, i) => (
              <StaticNode
                key={integ.id}
                icon={<span className="text-sm leading-none">{integ.icon}</span>}
                label={integ.name}
                sublabel="Integration"
                color="secondary"
                delay={0.3 + i * 0.05}
              />
            ))}
          </div>
        )}

        {hasGuardrails && (
          <>
            <Connector delay={0.4} />
            <StaticNode
              icon={<Shield className="w-3.5 h-3.5" />}
              label="Guardrails"
              sublabel={config.guardrails.requireApproval ? 'Approval req.' : 'Auto'}
              color="warning"
              delay={0.45}
            />
          </>
        )}

        <Connector delay={0.5} />
        <StaticNode
          icon={<Bot className="w-3.5 h-3.5" />}
          label={config.name || 'Agent'}
          sublabel="Output"
          color="accent"
          delay={0.55}
        />
      </div>
    </div>
  );
};

/* ── Sortable skill node ── */

const SortableSkillNode = ({ skill, index }: { skill: AgentSkill; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.05, duration: 0.25, type: 'spring', stiffness: 300 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 min-w-[110px] cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg ring-1 ring-primary/30' : ''}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-sm leading-none shrink-0">{skill.icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate">{skill.name}</p>
        <p className="text-[9px] text-muted-foreground">Step {index + 1}</p>
      </div>
    </motion.div>
  );
};

/* ── Static node ── */

const colorMap: Record<string, string> = {
  primary: 'border-primary/40 bg-primary/10',
  accent: 'border-accent/40 bg-accent/10',
  secondary: 'border-border bg-secondary',
  warning: 'border-yellow-500/40 bg-yellow-500/10',
};

const StaticNode = ({
  icon, label, sublabel, color, delay,
}: {
  icon: React.ReactNode; label: string; sublabel: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.25, type: 'spring', stiffness: 300 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorMap[color] || colorMap.secondary} min-w-[100px]`}
  >
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-foreground truncate">{label}</p>
      <p className="text-[9px] text-muted-foreground">{sublabel}</p>
    </div>
  </motion.div>
);

/* ── Connector ── */

const Connector = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center self-center"
  >
    <div className="w-6 h-px bg-border" />
    <ArrowRight className="w-3 h-3 text-muted-foreground -ml-1" />
  </motion.div>
);

export default WorkflowGraph;
