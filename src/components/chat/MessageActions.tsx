import { useState, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

type Props = {
  content: string;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
};

const MessageActions = ({ content, onRegenerate, showRegenerate }: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={copy}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copié" : "Copier"}
      </button>
      {showRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Régénérer
        </button>
      )}
    </div>
  );
};

export default MessageActions;
