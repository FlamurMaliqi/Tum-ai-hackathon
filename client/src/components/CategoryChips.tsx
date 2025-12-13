import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
          selected === null
            ? "bg-foreground text-background shadow-md"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        Alle
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
            selected === category
              ? "bg-foreground text-background shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
