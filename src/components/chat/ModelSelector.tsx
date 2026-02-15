import { ChevronDown } from "lucide-react";

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Rapide & équilibré" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Plus précis, plus lent" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini Flash Lite", desc: "Ultra rapide" },
];

type Props = {
  model: string;
  onChange: (model: string) => void;
};

const ModelSelector = ({ model, onChange }: Props) => {
  const current = MODELS.find((m) => m.id === model) || MODELS[0];

  return (
    <div className="relative group/model">
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
        <span className="font-medium">{current.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-lg opacity-0 invisible group-hover/model:opacity-100 group-hover/model:visible transition-all z-50 py-1">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors ${
              model === m.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <div className="text-sm font-medium">{m.label}</div>
            <div className="text-xs text-muted-foreground">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
