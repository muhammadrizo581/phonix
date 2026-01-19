import { CITY_OPTIONS, UzbekistanCity } from "@/hooks/usePhones";
import { cn } from "@/lib/utils";

interface CityFilterProps {
  selectedCity: UzbekistanCity | null;
  onCityChange: (city: UzbekistanCity | null) => void;
}

export function BrandFilter({ selectedCity, onCityChange }: CityFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCityChange(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
          selectedCity === null 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Barchasi
      </button>
      {CITY_OPTIONS.map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            selectedCity === city 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {city}
        </button>
      ))}
    </div>
  );
}
