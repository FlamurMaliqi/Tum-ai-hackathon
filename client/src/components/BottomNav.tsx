import { Home, Package, Search, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

const navItems = [
  { icon: Home, label: "Start", path: "/" },
  { icon: Search, label: "Suche", path: "/search" },
  { icon: Package, label: "Bestellungen", path: "/orders" },
  { icon: ShoppingCart, label: "Warenkorb", path: "/cart" },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-bottom z-50">
      <div className="flex justify-around items-center h-18 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isCart = path === "/cart";
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 touch-target relative transition-all duration-200",
                isActive 
                  ? "text-primary scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-xs transition-all duration-200",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
              {isCart && totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
