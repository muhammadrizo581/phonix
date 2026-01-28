import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select("phone_id")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map(f => f.phone_id);
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phoneId, userId, isFavorite }: { phoneId: string; userId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await (supabase as any)
          .from("likes")
          .delete()
          .eq("phone_id", phoneId)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await (supabase as any)
          .from("likes")
          .insert({ phone_id: phoneId, user_id: userId });

        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      toast.success(isFavorite ? "Sevimlilardan olib tashlandi" : "Sevimlilarga qo'shildi");
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });
}
