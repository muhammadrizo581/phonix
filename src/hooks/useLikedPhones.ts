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
        // ✅ UNLIKE
        const { error } = await (supabase as any)
          .from("likes")
          .delete()
          .eq("phone_id", phoneId)
          .eq("user_id", userId);

        if (error) throw error;
        return { action: "unliked" };
      } else {
        // ✅ LIKE
        const { error } = await (supabase as any)
          .from("likes")
          .insert({
            phone_id: phoneId,
            user_id: userId,
          });

        if (error) throw error;
        return { action: "liked" };
      }
    },

    // 🔥 OPTIMISTIC UPDATE (instant UI)
    onMutate: async ({ phoneId, userId, isLiked }) => {
      await queryClient.cancelQueries({
        queryKey: ["liked-phone-ids", userId],
      });

      const previous = queryClient.getQueryData<string[]>([
        "liked-phone-ids",
        userId,
      ]);

      queryClient.setQueryData<string[]>(
        ["liked-phone-ids", userId],
        (old = []) => {
          if (isLiked) {
            return old.filter((id) => id !== phoneId);
          } else {
            return [...old, phoneId];
          }
        }
      );

      return { previous };
    },

    // ❌ ERROR bo'lsa rollback
    onError: (_, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["liked-phone-ids", userId],
          context.previous
        );
      }

      toast({
        title: "Xatolik",
        description: "Like qo'yishda xatolik",
        variant: "destructive",
      });
    },

    // ✅ SUCCESS
    onSuccess: (data) => {
      toast({
        description:
          data.action === "liked"
            ? "Sevimlilarga qo'shildi"
            : "Sevimlilardan o'chirildi",
      });
    },

    // 🔄 Sync qilish
    onSettled: (_, __, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: ["liked-phone-ids", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["liked-phones", userId],
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