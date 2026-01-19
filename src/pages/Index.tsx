import { useState, useMemo } from "react";
import {
  usePhones,
  STORAGE_OPTIONS,
  CONDITION_OPTIONS,
  UzbekistanCity,
  PhoneStorage,
  PhoneCondition,
} from "@/hooks/usePhones";
import { useBrands } from "@/hooks/useBrands";
import { Header } from "@/components/Header";
import { PhoneGrid } from "@/components/PhoneGrid";
import { BrandFilter } from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/* ================= TYPES ================= */

type BrandFilterValue = string | "all";
type StorageFilterValue = PhoneStorage | "all";
type ConditionFilterValue = PhoneCondition | "all";

/* ================= COMPONENT ================= */

export default function Index() {
  const [cityFilter, setCityFilter] = useState<UzbekistanCity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [brandFilter, setBrandFilter] = useState<BrandFilterValue>("all");
  const [storageFilter, setStorageFilter] =
    useState<StorageFilterValue>("all");
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilterValue>("all");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: phones, isLoading } = usePhones(cityFilter || undefined);
  const { data: brands } = useBrands();
  const { user } = useAuth();

  /* ================= HELPERS ================= */

  const conditionLabelMap: Record<PhoneCondition, string> = {
    yaxshi: "Yaxshi",
    ortacha: "O'rtacha",
    yaxshi_emas: "Yaxshi emas",
  };

  const selectedBrandName =
    brandFilter !== "all"
      ? brands?.find((b) => b.id === brandFilter)?.name
      : null;

  /* ================= FILTER LOGIC ================= */

  const filteredPhones = useMemo(() => {
    if (!phones) return [];

    return phones.filter((phone) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !phone.name.toLowerCase().includes(q) &&
          !phone.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Brand
      if (brandFilter !== "all" && phone.brand_id !== brandFilter)
        return false;

      // Storage
      if (storageFilter !== "all" && phone.storage !== storageFilter)
        return false;

      // Condition
      if (conditionFilter !== "all" && phone.condition !== conditionFilter)
        return false;

      // Price
      if (minPrice && phone.price < Number(minPrice)) return false;
      if (maxPrice && phone.price > Number(maxPrice)) return false;

      return true;
    });
  }, [
    phones,
    searchQuery,
    brandFilter,
    storageFilter,
    conditionFilter,
    minPrice,
    maxPrice,
  ]);

  const activeFiltersCount = [
    brandFilter !== "all",
    storageFilter !== "all",
    conditionFilter !== "all",
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setBrandFilter("all");
    setStorageFilter("all");
    setConditionFilter("all");
    setMinPrice("");
    setMaxPrice("");
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* SEARCH + FILTER BUTTON */}
      <section className="border-b bg-card py-4">
        <div className="container">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 pl-10"
                placeholder="Nima qidiryapsiz?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="relative">
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtrlar</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* BRAND */}
                  <div className="space-y-2">
                    <Label>Brend</Label>
                    <Select
                      value={brandFilter}
                      onValueChange={(v) =>
                        setBrandFilter(v as BrandFilterValue)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Barchasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        {brands?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* STORAGE */}
                  <div className="space-y-2">
                    <Label>Xotira</Label>
                    <Select
                      value={storageFilter}
                      onValueChange={(v) =>
                        setStorageFilter(v as StorageFilterValue)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Barchasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        {STORAGE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CONDITION */}
                  <div className="space-y-2">
                    <Label>Holati</Label>
                    <Select
                      value={conditionFilter}
                      onValueChange={(v) =>
                        setConditionFilter(v as ConditionFilterValue)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Barchasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        {CONDITION_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PRICE */}
                  <div className="space-y-2">
                    <Label>Narx oralig'i</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearFilters}>
                      Tozalash
                    </Button>
                    <Button onClick={() => setFiltersOpen(false)}>
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>


      {/* ACTIVE FILTERS */}
      {(searchQuery || activeFiltersCount > 0) && (
        <section className="border-b bg-muted/50 py-2">
          <div className="container flex flex-wrap gap-2">
            {searchQuery && (
              <FilterTag label={`Qidiruv: "${searchQuery}"`} onClear={() => setSearchQuery("")} />
            )}
            {selectedBrandName && (
              <FilterTag label={`Brend: ${selectedBrandName}`} onClear={() => setBrandFilter("all")} />
            )}
            {storageFilter !== "all" && (
              <FilterTag label={`Xotira: ${storageFilter}`} onClear={() => setStorageFilter("all")} />
            )}
            {conditionFilter !== "all" && (
              <FilterTag
                label={`Holat: ${conditionLabelMap[conditionFilter]}`}
                onClear={() => setConditionFilter("all")}
              />
            )}
            {(minPrice || maxPrice) && (
              <FilterTag
                label={`Narx: ${minPrice || "0"} - ${maxPrice || "∞"}`}
                onClear={() => {
                  setMinPrice("");
                  setMaxPrice("");
                }}
              />
            )}
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery("");
                clearFilters();
              }}
            >
              Barchasini tozalash
            </button>
          </div>
        </section>
      )}

      {/* GRID */}
      <main className="container py-6">
        <PhoneGrid phones={filteredPhones} isLoading={isLoading} />
      </main>
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function FilterTag({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
      {label}
      <button onClick={onClear}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
