import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteAllConversations: () => void;
};

const THEME_KEY = "nexusai-theme";
const LANG_KEY = "nexusai-lang";
const SPEECH_LANG_KEY = "nexusai-speech-lang";

const SettingsDialog = ({ open, onOpenChange, onDeleteAllConversations }: Props) => {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || "auto");
  const [speechLang, setSpeechLang] = useState(() => localStorage.getItem(SPEECH_LANG_KEY) || "auto");

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    if (theme === "system") {
      root.classList.remove("light", "dark");
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        root.classList.add("light");
      } else {
        root.classList.add("dark");
      }
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(SPEECH_LANG_KEY, speechLang);
  }, [speechLang]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-foreground text-lg">Paramètres</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-1">
          {/* Section: Général */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">Général</p>

          {/* Apparence */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-sm text-foreground">Apparence</span>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-40 h-8 text-sm bg-transparent border-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="light">Clair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Langue */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-sm text-foreground">Langue</span>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="w-48 h-8 text-sm bg-transparent border-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Détection automatique</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Langue parlée */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <span className="text-sm text-foreground">Langue parlée</span>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                Pour de meilleurs résultats, sélectionnez votre langue principale.
              </p>
            </div>
            <Select value={speechLang} onValueChange={setSpeechLang}>
              <SelectTrigger className="w-48 h-8 text-sm bg-transparent border-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Détection automatique</SelectItem>
                <SelectItem value="fr-FR">Français</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
                <SelectItem value="de-DE">Deutsch</SelectItem>
                <SelectItem value="ar-SA">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-border mt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">Zone de danger</p>
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
