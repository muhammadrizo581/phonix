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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, Check } from "lucide-react";
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
type ConditionFilterValue = PhoneCondition | "all";

/* ================= COMPONENT ================= */

export default function Index() {
  const [cityFilter, setCityFilter] = useState<UzbekistanCity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [brandFilter, setBrandFilter] = useState<BrandFilterValue>("all");
  const [storageFilters, setStorageFilters] = useState<PhoneStorage[]>([]);
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilterValue>("all");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: phones, isLoading } = usePhones(cityFilter || undefined);
  const { data: brands } = useBrands();

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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !phone.name.toLowerCase().includes(q) &&
          !phone.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (brandFilter !== "all" && phone.brand_id !== brandFilter) return false;
      if (storageFilters.length && !storageFilters.includes(phone.storage))
        return false;
      if (conditionFilter !== "all" && phone.condition !== conditionFilter)
        return false;
      if (minPrice && phone.price < Number(minPrice)) return false;
      if (maxPrice && phone.price > Number(maxPrice)) return false;

      return true;
    });
  }, [
    phones,
    searchQuery,
    brandFilter,
    storageFilters,
    conditionFilter,
    minPrice,
    maxPrice,
  ]);

  const activeFiltersCount = [
    brandFilter !== "all",
    storageFilters.length > 0,
    conditionFilter !== "all",
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setBrandFilter("all");
    setStorageFilters([]);
    setConditionFilter("all");
    setMinPrice("");
    setMaxPrice("");
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[env(safe-area-inset-top)] bg-card" />
      <Header />

      {/* SEARCH + FILTER BAR */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl pl-10 pr-10"
                placeholder="Nima qidiryapsiz?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-11 w-11 rounded-xl"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent
                side="bottom"
                className="rounded-t-2xl max-h-[90vh] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Filtrlar</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-5 pb-6">
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
                    <div className="rounded-lg border p-3 space-y-3">
                      {STORAGE_OPTIONS.map((storage) => {
                        const checked = storageFilters.includes(storage);
                        return (
                          <button
                            key={storage}
                            onClick={() =>
                              setStorageFilters((prev) =>
                                checked
                                  ? prev.filter((s) => s !== storage)
                                  : [...prev, storage]
                              )
                            }
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`h-5 w-5 rounded border flex items-center justify-center ${
                                checked
                                  ? "bg-primary border-primary"
                                  : "border-input"
                              }`}
                            >
                              {checked && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <span>{storage}</span>
                          </button>
                        );
                      })}
                    </div>
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
                    <Label>Narx</Label>
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      Tozalash
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* ACTIVE FILTER TAGS */}
      {(searchQuery || activeFiltersCount > 0) && (
        <section className="border-b bg-muted/50">
          <div className="container mx-auto px-4 py-2 flex flex-wrap gap-2">
            {searchQuery && (
              <FilterTag
                label={`Qidiruv: "${searchQuery}"`}
                onClear={() => setSearchQuery("")}
              />
            )}
            {selectedBrandName && (
              <FilterTag
                label={`Brend: ${selectedBrandName}`}
                onClear={() => setBrandFilter("all")}
              />
            )}
            {storageFilters.map((s) => (
              <FilterTag
                key={s}
                label={`Xotira: ${s}`}
                onClear={() =>
                  setStorageFilters((prev) => prev.filter((x) => x !== s))
                }
              />
            ))}
            {conditionFilter !== "all" && (
              <FilterTag
                label={`Holat: ${conditionLabelMap[conditionFilter]}`}
                onClear={() => setConditionFilter("all")}
              />
            )}
            {(minPrice || maxPrice) && (
              <FilterTag
                label={`Narx: ${minPrice || 0} - ${maxPrice || "∞"}`}
                onClear={() => {
                  setMinPrice("");
                  setMaxPrice("");
                }}
              />
            )}
          </div>
        </section>
      )}

      {/* GRID */}
      <main className="container mx-auto px-4 py-6">
        <PhoneGrid phones={filteredPhones} isLoading={isLoading} />
      </main>
    </div>
  );
}

/* ================= TAG ================= */

function FilterTag({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
      {label}
      <button onClick={onClear}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
