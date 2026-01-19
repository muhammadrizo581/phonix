import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type PhoneStorage = Database["public"]["Enums"]["phone_storage"];
export type PhoneCondition = Database["public"]["Enums"]["phone_condition"];
export type UzbekistanCity = Database["public"]["Enums"]["uzbekistan_city"];

export interface Phone {
  id: string;
  name: string;
  description: string | null;
  price: number;
  storage: PhoneStorage;
  condition: PhoneCondition;
  city: UzbekistanCity;
  brand_id: string | null;
  battery_health: number | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface PhoneFormData {
  name: string;
  description?: string;
  price: number;
  storage: PhoneStorage;
  condition: PhoneCondition;
  city: UzbekistanCity;
  brand_id?: string;
  battery_health?: number;
}

// Apple brand ID for battery health field
export const APPLE_BRAND_ID = "5f180250-32ab-45a8-9d45-0733f54ef016";

export const STORAGE_OPTIONS: PhoneStorage[] = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

export const CONDITION_OPTIONS: { value: PhoneCondition; label: string }[] = [
  { value: 'yaxshi', label: 'Yaxshi' },
  { value: 'ortacha', label: 'O\'rtacha' },
  { value: 'yaxshi_emas', label: 'Yaxshi emas' },
];

export const CITY_OPTIONS: UzbekistanCity[] = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  'Fargona',
  'Qarshi',
  'Nukus',
  'Urganch',
  'Jizzax',
  'Navoiy',
  'Guliston',
  'Termiz',
  'Chirchiq',
];

export function usePhones(cityFilter?: UzbekistanCity) {
  return useQuery({
    queryKey: ["phones", cityFilter],
    queryFn: async () => {
      let query = supabase
        .from("phones")
        .select("*")
        .order("created_at", { ascending: false });

      if (cityFilter) {
        query = query.eq("city", cityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Phone[];
    },
  });
}

export function useCreatePhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: PhoneFormData & { owner_id: string }) => {
      const { data, error } = await supabase
        .from("phones")
        .insert(phone)
        .select()
        .single();

      if (error) throw error;

      // Call edge function to check for matching requests and notify users
      try {
        await supabase.functions.invoke("check-phone-requests", {
          body: { phone: data },
        });
      } catch (e) {
        console.error("Error checking phone requests:", e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      toast.success("E'lon muvaffaqiyatli yaratildi!");
    },
    onError: (error) => {
      toast.error("E'lon yaratishda xatolik: " + error.message);
    },
  });
}

export function useUpdatePhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...phone }: PhoneFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("phones")
        .update(phone)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      toast.success("E'lon muvaffaqiyatli yangilandi!");
    },
    onError: (error) => {
      toast.error("E'lonni yangilashda xatolik: " + error.message);
    },
  });
}

export function useDeletePhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("phones")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      toast.success("E'lon o'chirildi!");
    },
    onError: (error) => {
      toast.error("E'lonni o'chirishda xatolik: " + error.message);
    },
  });
}
