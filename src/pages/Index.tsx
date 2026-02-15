import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Paperclip, X, Bot, User, Loader2, Sparkles, Zap, Image, Code2 } from "lucide-react";
import { streamChat, fileToBase64, type ChatMessage } from "@/lib/chat";
import { toast } from "sonner";

type UIMessage = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

const TypingDots = () => (
  <div className="flex items-center gap-1.5 px-1 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-primary"
        style={{ animation: `pulse-dot 1.4s infinite ${i * 0.2}s` }}
      />
    ))}
  </div>
);

const EmptyState = ({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) => {
  const suggestions = [
    { icon: Image, label: "Analyse cette image", desc: "Vision & analyse" },
    { icon: Code2, label: "Écris du code Python", desc: "Code generation" },
    { icon: Sparkles, label: "Explique ce concept", desc: "Knowledge base" },
    { icon: Zap, label: "Résous ce problème", desc: "Problem solving" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 px-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center glow-primary">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-1 glow-text">NexusAI</h2>
        <p className="text-sm text-muted-foreground font-mono tracking-wider uppercase">
          Gemini 2.5 Pro • Multimodal • Streaming
        </p>
      </div>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        Envoie du texte, des images, des screenshots. Réponses directes, sans filtre inutile.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-md mt-2 w-full">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.label)}
            className="group flex flex-col gap-2 px-4 py-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-left hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <s.icon className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-medium text-foreground">{s.label}</span>
            <span className="text-xs text-muted-foreground font-mono">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const MessageBubble = ({ msg }: { msg: UIMessage }) => {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex-shrink-0 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card/80 backdrop-blur-sm border border-border text-foreground rounded-bl-md"
        }`}
      >
        {msg.images && msg.images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {msg.images.map((img, j) => (
              <img
                key={j}
                src={img}
                alt="attachment"
                className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border/50"
              />
            ))}
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:font-mono [&_code]:text-primary [&_code]:font-mono [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_a]:text-primary [&_strong]:text-foreground [&_li]:text-foreground/90">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

const Index = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Fichier trop volumineux (max 20MB)");
        return;
      }
      const preview = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { file, preview }]);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const imageBase64s: string[] = [];
    for (const att of attachments) {
      if (att.file.type.startsWith("image/")) {
        imageBase64s.push(await fileToBase64(att.file));
      }
    }

    const userMsg: UIMessage = {
      role: "user",
      content: text,
      images: imageBase64s.length > 0 ? imageBase64s : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    const apiMessages: ChatMessage[] = [...messages, userMsg].map((m) => {
      if (m.images && m.images.length > 0) {
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        if (m.content) content.push({ type: "text", text: m.content });
        m.images.forEach((img) => content.push({ type: "image_url", image_url: { url: img } }));
        return { role: m.role, content };
      }
      return { role: m.role, content: m.content };
    });

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: apiMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Erreur de connexion");
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;

    e.preventDefault();
    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;
      const preview = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { file, preview }]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3 flex items-center gap-3 backdrop-blur-xl bg-background/80 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground tracking-tight">NexusAI</h1>
          <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
            Gemini 2.5 Pro • Online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Active</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <EmptyState onSuggestionClick={setInput} />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex-shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4 backdrop-blur-xl bg-background/80">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.file.type.startsWith("image/") ? (
                  <img
                    src={att.preview}
                    alt="preview"
                    className="w-16 h-16 rounded-xl object-cover border border-border/50 ring-1 ring-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-card flex items-center justify-center border border-border/50">
                    <span className="text-[10px] text-muted-foreground text-center px-1 truncate font-mono">
                      {att.file.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-1.5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.json,.csv,.py,.js,.ts,.tsx,.html,.css"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Écris ton message..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-[inherit]"
          />
          <button
            onClick={send}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 disabled:opacity-30 flex-shrink-0 glow-primary"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2 font-mono">
          NexusAI peut faire des erreurs. Vérifie les informations importantes.
        </p>
      </div>
    </div>
  );
};

export default Index;
