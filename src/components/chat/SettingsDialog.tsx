import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteAllConversations: () => void;
};

const SettingsDialog = ({ open, onOpenChange, onDeleteAllConversations }: Props) => {
  const [streamEnabled, setStreamEnabled] = useState(() => {
    try { return localStorage.getItem("nexusai-stream") !== "false"; } catch { return true; }
  });

  const handleStreamToggle = (checked: boolean) => {
    setStreamEnabled(checked);
    localStorage.setItem("nexusai-stream", String(checked));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Paramètres</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Streaming */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Streaming des réponses</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Afficher les réponses mot par mot</p>
            </div>
            <Switch checked={streamEnabled} onCheckedChange={handleStreamToggle} />
          </div>

          {/* Delete all conversations */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => {
                onDeleteAllConversations();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer toutes les conversations
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
