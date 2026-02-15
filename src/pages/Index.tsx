import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Paperclip, X, Bot, User, Loader2 } from "lucide-react";
import { streamChat, fileToBase64, type ChatMessage } from "@/lib/chat";
import { toast } from "sonner";

type UIMessage = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
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

    // Build API messages
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">NexusAI</h1>
          <p className="text-xs text-muted-foreground">Gemini 2.5 Pro • Vision • Multimodal</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">NexusAI</h2>
              <p className="text-muted-foreground max-w-md">
                Envoie-moi du texte, des images, des screenshots. Je suis direct et efficace.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg mt-4">
              {["Analyse cette image", "Écris du code Python", "Explique ce concept", "Résous ce problème"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {msg.images.map((img, j) => (
                    <img
                      key={j}
                      src={img}
                      alt="attachment"
                      className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-accent-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.file.type.startsWith("image/") ? (
                  <img
                    src={att.preview}
                    alt="preview"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <span className="text-[10px] text-muted-foreground text-center px-1 truncate">
                      {att.file.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
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
            className="p-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={send}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
