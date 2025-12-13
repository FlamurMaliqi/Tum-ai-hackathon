import { Lock, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CMats</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          className="text-muted-foreground hover:text-foreground rounded-xl"
        >
          <Lock className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Sprachgesteuert bestellen
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">
            Was brauchen Sie heute?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xs mx-auto">
            Tippen Sie auf den Button und sprechen Sie Ihre Bestellung
          </p>
        </div>

        {/* Voice Order Button */}
        <button
          onClick={() => navigate("/voice")}
          className="group relative h-44 w-44 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex flex-col items-center justify-center transition-all duration-300 active:scale-95 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30"
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl group-hover:blur-3xl transition-all" />
          <Mic className="h-14 w-14 mb-2 relative z-10" />
          <span className="text-base font-semibold relative z-10">Per Sprache</span>
        </button>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-10">
          <Button 
            variant="secondary" 
            onClick={() => navigate("/search")}
            className="rounded-xl h-12 px-6 card-shadow"
          >
            Produkte durchsuchen
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
