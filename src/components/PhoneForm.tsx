import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PhoneFormData, 
  STORAGE_OPTIONS, 
  CONDITION_OPTIONS, 
  CITY_OPTIONS,
  PhoneStorage,
  PhoneCondition,
  UzbekistanCity,
  APPLE_BRAND_ID
} from "@/hooks/usePhones";
import { useBrands } from "@/hooks/useBrands";
import { Loader2, Battery } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { useAuth } from "@/hooks/useAuth";

const phoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak")
    .max(100, "Nom 100 ta belgidan oshmasligi kerak"),
  description: z
    .string()
    .trim()
    .max(1000, "Tavsif 1000 ta belgidan oshmasligi kerak")
    .optional(),
  price: z
    .number({ required_error: "Narx kiritilishi shart" })
    .min(1, "Narx kamida 1 bo'lishi kerak"),
  storage: z.enum(['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] as const),
  condition: z.enum(['yaxshi', 'ortacha', 'yaxshi_emas'] as const),
  city: z.enum([
    'Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 
    'Fargona', 'Qarshi', 'Nukus', 'Urganch', 'Jizzax', 
    'Navoiy', 'Guliston', 'Termiz', 'Chirchiq'
  ] as const),
  brand_id: z.string().optional(),
  battery_health: z.number().min(0).max(100).optional(),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

interface PhoneFormProps {
  defaultValues?: Partial<PhoneFormData>;
  defaultImages?: string[];
  onSubmit: (data: PhoneFormData, images: string[]) => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function PhoneForm({
  defaultValues,
  defaultImages = [],
  onSubmit,
  isSubmitting,
  submitLabel = "E'lon yaratish",
}: PhoneFormProps) {
  const { user } = useAuth();
  const { data: brands } = useBrands();
  const [images, setImages] = useState<string[]>(defaultImages);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      price: defaultValues?.price || 0,
      storage: defaultValues?.storage || "128GB",
      condition: defaultValues?.condition || "yaxshi",
      city: defaultValues?.city || "Toshkent",
      brand_id: defaultValues?.brand_id || "",
      battery_health: defaultValues?.battery_health || undefined,
    },
  });

  const selectedBrandId = form.watch("brand_id");
  const isApple = selectedBrandId === APPLE_BRAND_ID;

  const handleSubmit = (data: PhoneFormValues) => {
    onSubmit(
      {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        storage: data.storage as PhoneStorage,
        condition: data.condition as PhoneCondition,
        city: data.city as UzbekistanCity,
        brand_id: data.brand_id || undefined,
        battery_health: isApple ? data.battery_health : undefined,
      },
      images
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div>
          <FormLabel className="mb-3 block">Rasmlar</FormLabel>
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={5}
            userId={user?.id}
          />
        </div>

        <FormField
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brend</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Brendni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon nomi</FormLabel>
              <FormControl>
                <Input placeholder="Masalan: iPhone 15 Pro Max" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="storage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xotira</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Xotirani tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STORAGE_OPTIONS.map((storage) => (
                      <SelectItem key={storage} value={storage}>
                        {storage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Holati</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Holatni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Battery Health - only show for Apple/iPhone */}
        {isApple && (
          <FormField
            control={form.control}
            name="battery_health"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-primary" />
                  Batareyka sig'imi (%)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Masalan: 87"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val ? parseInt(val, 10) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shahar</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Shaharni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CITY_OPTIONS.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Narxi ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="10000000"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tavsif</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Telefon haqida ma'lumot: ayblari (batareyka almashgan, ekran singan), plyuslari (chexol, qo'shimcha aksessuarlar)..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full shadow-button" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
