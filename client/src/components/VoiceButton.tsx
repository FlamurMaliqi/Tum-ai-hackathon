import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening?: boolean;
  onClick: () => void;
  size?: "default" | "large";
}

export function VoiceButton({ isListening = false, onClick, size = "default" }: VoiceButtonProps) {
  const sizeClasses = size === "large" 
    ? "h-32 w-32" 
    : "h-14 w-14";
  
  const iconSize = size === "large" ? "h-12 w-12" : "h-6 w-6";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-2xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20",
        sizeClasses,
        isListening && "bg-destructive shadow-destructive/20"
      )}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-2xl bg-destructive animate-pulse-ring" />
          <span className="absolute inset-0 rounded-2xl bg-destructive animate-pulse-ring [animation-delay:0.5s]" />
        </>
      )}
      <Mic className={cn(iconSize, "relative z-10")} />
    </button>
  );
}
