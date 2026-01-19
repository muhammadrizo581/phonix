import { useState } from "react";
import { CITY_OPTIONS, STORAGE_OPTIONS, CONDITION_OPTIONS, UzbekistanCity, PhoneStorage, PhoneCondition } from "@/hooks/usePhones";
import { useBrands } from "@/hooks/useBrands";
import { useCreatePhoneRequest } from "@/hooks/usePhoneRequests";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Bell } from "lucide-react";

interface PhoneRequestFormProps {
  onSuccess?: () => void;
}

export function PhoneRequestForm({ onSuccess }: PhoneRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [city, setCity] = useState<string>("");
  const [storage, setStorage] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { user } = useAuth();
  const { data: brands } = useBrands();
  const createRequest = useCreatePhoneRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !keywords.trim()) return;

    createRequest.mutate(
      {
        user_id: user.id,
        keywords: keywords.trim(),
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        city: city ? (city as UzbekistanCity) : undefined,
        storage: storage ? (storage as PhoneStorage) : undefined,
        condition: condition ? (condition as PhoneCondition) : undefined,
        brand_id: brandId || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setKeywords("");
          setCity("");
          setStorage("");
          setCondition("");
          setBrandId("");
          setMinPrice("");
          setMaxPrice("");
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
          <Bell className="h-4 w-4" />
          So'rov qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Telefon so'rovi</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Qidirayotgan telefoningizni tavsiflang. O'xshash telefon e'lon qilinganda sizga xabar beramiz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-foreground">Kalit so'zlar *</Label>
            <Input
              id="keywords"
              placeholder="Masalan: iPhone 15 Pro Max"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand" className="text-foreground">Brend</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Brendni tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-foreground">Shahar</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CITY_OPTIONS.map((cityOption) => (
                    <SelectItem key={cityOption} value={cityOption}>
                      {cityOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage" className="text-foreground">Xotira</Label>
              <Select value={storage} onValueChange={setStorage}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {STORAGE_OPTIONS.map((storageOption) => (
                    <SelectItem key={storageOption} value={storageOption}>
                      {storageOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition" className="text-foreground">Holati</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Holatni tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CONDITION_OPTIONS.map((condOption) => (
                  <SelectItem key={condOption.value} value={condOption.value}>
                    {condOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPrice" className="text-foreground">Min narx</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="text-foreground">Max narx</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="1000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-primary hover:bg-primary/90"
            disabled={createRequest.isPending || !keywords.trim()}
          >
            <Plus className="h-4 w-4" />
            {createRequest.isPending ? "Yaratilmoqda..." : "So'rov yaratish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
