import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { Product } from "@/data/products";

// Backend article response type
interface BackendArticle {
  artikel_id: string;
  artikelname: string;
  kategorie: string;
  einheit: string;
  preis_eur: number | string | null;
  lieferant: string;
  verbrauchsart: string;
  gefahrgut: boolean;
  lagerort: string;
  typische_baustelle: string;
}

// Map backend article to frontend Product
function mapBackendArticleToProduct(article: BackendArticle): Product {
  // Handle null or undefined prices - default to 0
  let price = 0;
  if (article.preis_eur !== null && article.preis_eur !== undefined) {
    if (typeof article.preis_eur === "string") {
      const parsed = parseFloat(article.preis_eur);
      price = isNaN(parsed) ? 0 : parsed;
    } else {
      price = article.preis_eur;
    }
  }
  
  return {
    id: article.artikel_id,
    name: article.artikelname,
    category: article.kategorie,
    unit: article.einheit,
    price: price,
    supplier: article.lieferant,
    consumptionType: article.verbrauchsart,
    hazardous: article.gefahrgut,
    storageLocation: article.lagerort,
    typicalSite: article.typische_baustelle,
  };
}

async function fetchArticles(search?: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  
  const url = apiUrl(`/api/v1/artikel/?${params.toString()}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  
  const data: BackendArticle[] = await response.json();
  return data.map(mapBackendArticleToProduct);
}

export function useArticles(search?: string, category?: string) {
  return useQuery({
    queryKey: ["articles", search, category],
    queryFn: () => fetchArticles(search, category),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

// Hook to get unique categories from articles
export function useCategories() {
  const { data: articles = [] } = useArticles();
  
  const categories = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    return [...new Set(articles.map(a => a.category))].sort();
  }, [articles]);
  
  return categories;
}

