import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

// Backend construction site response type
interface BackendConstructionSite {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ConstructionSite {
  id: number;
  name: string;
}

async function fetchConstructionSites(): Promise<ConstructionSite[]> {
  const url = apiUrl(`/api/v1/construction-sites/`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch construction sites: ${response.statusText}`);
  }
  
  const data: BackendConstructionSite[] = await response.json();
  return data.map(site => ({
    id: site.id,
    name: site.name,
  }));
}

export function useConstructionSites() {
  return useQuery({
    queryKey: ["construction-sites"],
    queryFn: fetchConstructionSites,
    staleTime: 300000, // Consider data fresh for 5 minutes
  });
}

