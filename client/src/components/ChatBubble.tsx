import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-lg"
            : "bg-secondary text-secondary-foreground rounded-bl-lg"
        )}
      >
        <p className="text-[15px] leading-relaxed">{message.content}</p>
        <span className={cn(
          "text-[10px] mt-1.5 block opacity-70",
        )}>
          {message.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
