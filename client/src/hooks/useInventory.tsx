import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export interface InventoryItem {
  artikel_id: string;
  artikelname: string;
  kategorie: string;
  lieferant: string;
  construction_site: string;
  quantity?: number;
}

async function fetchInventory(): Promise<InventoryItem[]> {
  const url = apiUrl("/api/v1/inventory/");
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
  }
  
  const data: InventoryItem[] = await response.json();
  return data;
}

export function useInventory() {
  return useQuery<InventoryItem[], Error>({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

