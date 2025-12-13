import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
    }, 1500);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 card-shadow transition-all duration-200 hover:card-shadow-lg">
      <div className="flex-1 mb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
          {product.hazardous && (
            <span className="shrink-0 text-[10px] font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              Gefahrgut
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{product.supplier}</p>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xl font-bold">
            €{product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            / {product.unit}
          </span>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
          {product.category}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-none hover:bg-secondary"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-none hover:bg-secondary"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={handleAdd} 
          className={cn(
            "flex-1 h-10 rounded-xl transition-all duration-300",
            added && "bg-success hover:bg-success"
          )}
        >
          {added ? "Hinzugefügt ✓" : "Hinzufügen"}
        </Button>
      </div>
    </div>
  );
}
