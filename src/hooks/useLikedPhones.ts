import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Like qo'yilgan telefonlarni olish
export function useLikedPhoneIds(userId?: string) {
  return useQuery({
    queryKey: ["liked-phone-ids", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from("likes")
        .select("phone_id")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map((like) => like.phone_id);
    },
  });
}

// Like toggle funksiyasi
export function useToggleLike() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      phoneId,
      userId,
      isLiked,
    }: {
      phoneId: string;
      userId: string;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        // Unlike - o'chirish
        const { error } = await (supabase as any)
          .from("likes")
          .delete()
          .eq("phone_id", phoneId)
          .eq("user_id", userId);

        if (error) throw error;
        return { action: "unliked" };
      } else {
        // Like - qo'shish
        const { error } = await (supabase as any)
          .from("likes")
          .insert({ phone_id: phoneId, user_id: userId });

        if (error) throw error;
        return { action: "liked" };
      }
    },
    onSuccess: (data, variables) => {
      // Cache'ni yangilash
      queryClient.invalidateQueries({ queryKey: ["liked-phone-ids", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["liked-phones", variables.userId] });

      // Toast ko'rsatish
      toast({
        title: data.action === "liked" ? "" : "",
        description: data.action === "liked" 
          ? "Telefon sevimlilaringizga qo'shildi"
          : "Telefon sevimlilardan o'chirildi",
      });
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: "Like qo'yishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
}

// Liked phones ro'yxatini olish (sevimlilar sahifasi uchun)
export function useLikedPhones(userId?: string) {
  return useQuery({
    queryKey: ["liked-phones", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];

      // 1. Likes dan phone_id larni olamiz
      const { data: likes, error: likesError } = await (supabase as any)
        .from("likes")
        .select("phone_id")
        .eq("user_id", userId);

      if (likesError) throw likesError;

      const phoneIds = likes.map((l) => l.phone_id);

      if (phoneIds.length === 0) return [];

      // 2. Phones + images
      const { data: phones, error: phonesError } = await supabase
        .from("phones")
        .select(`
          *,
          phone_images (
            image_url,
            is_primary,
            display_order
          )
        `)
        .in("id", phoneIds)
        .order("created_at", { ascending: false });

      if (phonesError) throw phonesError;

      return phones ?? [];
    },
  });
}