import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { CategoryChips } from "@/components/CategoryChips";
import { ProductCard } from "@/components/ProductCard";
import { useArticles, useCategories } from "@/hooks/useArticles";

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Debounce search query to avoid too many API calls
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Fetch articles from backend with search and category filters
  const { data: products = [], isLoading, error } = useArticles(
    debouncedQuery || undefined,
    selectedCategory || undefined
  );
  
  const categories = useCategories();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 glass z-10 p-4 border-b border-border/50">
        <h1 className="text-xl font-bold mb-4">Produkte</h1>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen..."
            className="pl-11 h-12 text-base rounded-xl bg-secondary border-0 focus-visible:ring-1"
          />
        </div>

        {/* Category Chips */}
        <CategoryChips
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </header>

      {/* Products Grid */}
      <main className="p-4">
        {isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Lade Produkte...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive">Fehler beim Laden der Produkte</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unbekannter Fehler"}
            </p>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {products.length} Produkte
            </p>
            
            <div className="grid gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Keine Produkte gefunden</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
