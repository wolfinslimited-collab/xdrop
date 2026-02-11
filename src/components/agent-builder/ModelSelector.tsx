import { Check } from 'lucide-react';
import { AI_MODELS } from '@/types/agentBuilder';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

const tierColors: Record<string, string> = {
  premium: 'text-foreground',
  standard: 'text-muted-foreground',
  open: 'text-muted-foreground',
};

const ModelSelector = ({ selectedModel, onSelect }: ModelSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">AI Model</h3>
        <p className="text-xs text-muted-foreground">Choose the LLM that powers your agent</p>
      </div>

      <div className="space-y-1.5">
        {AI_MODELS.map(model => (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              selectedModel === model.id
                ? 'border-foreground/30 bg-muted'
                : 'border-border hover:border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-xs font-medium ${tierColors[model.tier]}`}>{model.name}</p>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{model.provider}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{model.description}</p>
            </div>
            {selectedModel === model.id && (
              <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Memory</label>
          <p className="text-[10px] text-muted-foreground/60">Long-term memory and conversation persistence powered by OpenClaw's vector storage.</p>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
