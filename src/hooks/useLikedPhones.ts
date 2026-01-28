import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLikedPhones(userId?: string) {
  return useQuery({
    queryKey: ["liked-phones", userId],
    enabled: Boolean(userId),

    queryFn: async () => {
      if (!userId) return [];

      // 1. likes dan phone_id larni olamiz
      const { data: likes, error: likesError } = await (supabase as any)
        .from("likes")
        .select("phone_id")
        .eq("user_id", userId);

      if (likesError) throw likesError;

      const phoneIds = likes.map((l) => l.phone_id);

      if (phoneIds.length === 0) return [];

      // 2. phones + images
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
