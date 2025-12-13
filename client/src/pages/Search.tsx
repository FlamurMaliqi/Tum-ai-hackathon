import { useState, useMemo } from "react";
import { Search as SearchIcon, ArrowLeft, Package, Grid3x3, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { useArticles } from "@/hooks/useArticles";

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all articles for category counts (no filters)
  const allArticles = useArticles();
  
  // Get articles with search and category filters
  const categoryFilter = selectedCategory === "Alle" ? undefined : selectedCategory;
  const { data: articles = [], isLoading, error } = useArticles(query || undefined, categoryFilter);

  // Extract unique categories with product counts
  const categoriesWithCounts = useMemo(() => {
    if (!allArticles.data) return [];
    
    const categoryMap = new Map<string, number>();
    allArticles.data.forEach(product => {
      const cat = product.category || "Unbekannt";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    
    // Add "All" category
    const allCategories = [
      { name: "Alle", count: allArticles.data.length },
      ...Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
    ];
    
    return allCategories;
  }, [allArticles.data]);

  // Show category grid if no category is selected
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 glass z-10 p-4 border-b border-border/50">
          <h1 className="text-2xl font-bold">Kategorien</h1>
        </header>

        {/* Category Grid (Simple Style) */}
        <main className="p-4">
          {allArticles.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {categoriesWithCounts.length} Kategorien
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {categoriesWithCounts.map(({ name, count }) => {
              const isAllCategory = name === "Alle";
              
              return (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className="relative h-28 rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:bg-muted/50 active:scale-[0.98] transition-all duration-200"
                >
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-4">
                    <div className="flex items-start justify-between">
                      {isAllCategory ? (
                        <Grid3x3 className="h-6 w-6 text-primary" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="text-left">
                      <h3 className="font-semibold text-base mb-1 line-clamp-2">
                        {name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'Produkt' : 'Produkte'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
              </div>
            </>
          )}
        </main>

        <BottomNav />
      </div>
    );
  }

  // Show products within selected category
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 glass z-10 p-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setQuery("");
            }}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedCategory}</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "..." : `${articles.length} ${articles.length === 1 ? 'Produkt' : 'Produkte'}`}
            </p>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`In ${selectedCategory} suchen...`}
            className="pl-11 h-12 text-base rounded-xl bg-secondary border-0 focus-visible:ring-1"
          />
        </div>
      </header>

      {/* Products Grid */}
      <main className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="grid gap-3">
              {articles.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {articles.length === 0 && (
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
