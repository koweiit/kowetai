import { MessageSquarePlus, Search, Trash2, X } from "lucide-react";

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
  isOpen: boolean;
  onClose: () => void;
};

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onClose }: Props) => {
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
      </aside>
    </>
  );
};

export default ChatSidebar;
