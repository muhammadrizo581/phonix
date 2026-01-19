import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { UzbekistanCity, PhoneStorage, PhoneCondition } from "@/hooks/usePhones";

export interface PhoneRequest {
  id: string;
  user_id: string;
  keywords: string;
  min_price: number | null;
  max_price: number | null;
  city: UzbekistanCity | null;
  storage: PhoneStorage | null;
  condition: PhoneCondition | null;
  brand_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhoneRequestFormData {
  keywords: string;
  min_price?: number;
  max_price?: number;
  city?: UzbekistanCity;
  storage?: PhoneStorage;
  condition?: PhoneCondition;
  brand_id?: string;
}

export function usePhoneRequests(userId?: string) {
  return useQuery({
    queryKey: ["phone-requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("phone_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PhoneRequest[];
    },
    enabled: !!userId,
  });
}

export function useCreatePhoneRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PhoneRequestFormData & { user_id: string }) => {
      const { data, error } = await supabase
        .from("phone_requests")
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-requests"] });
      toast.success("So'rov muvaffaqiyatli yaratildi!");
    },
    onError: (error) => {
      toast.error("So'rov yaratishda xatolik: " + error.message);
    },
  });
}

export function useDeletePhoneRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("phone_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-requests"] });
      toast.success("So'rov o'chirildi");
    },
    onError: (error) => {
      toast.error("So'rovni o'chirishda xatolik: " + error.message);
    },
  });
}

export function useTogglePhoneRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("phone_requests")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["phone-requests"] });
      toast.success(is_active ? "So'rov faollashtirildi" : "So'rov o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik: " + error.message);
    },
  });
}
