import { useState } from "react";
import { MessageSquarePlus, Trash2, X, LogIn, LogOut, Settings, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SettingsDialog from "./SettingsDialog";

export type Conversation = {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
};

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, onDeleteAll, isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      
      <aside
        className={`fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={onNew}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-sm text-foreground"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Nouveau chat
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/50 lg:hidden text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8 px-4">
              Aucune conversation
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-sm ${
                activeId === conv.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Profile / Auth section */}
        <div className="p-3 border-t border-border">
          {user ? (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{userInitials}</span>
                  </div>
                  <span className="flex-1 text-sm text-foreground truncate text-left">{userEmail}</span>
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 p-1.5 bg-card border-border rounded-xl"
              >
                {/* User info */}
                <div className="px-3 py-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground font-mono">Plan gratuit</p>
                </div>
                <div className="h-px bg-border my-1" />

                {/* Menu items */}
                <button
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Paramètres
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await supabase.auth.signOut();
                    navigate("/auth");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                  Se déconnecter
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Paramètres
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onDeleteAllConversations={onDeleteAll}
      />
    </>
  );
};

export default ChatSidebar;
