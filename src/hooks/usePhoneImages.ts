import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSavePhoneImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phoneId,
      imageUrls,
    }: {
      phoneId: string;
      imageUrls: string[];
    }) => {
      // First delete existing images for this phone
      await supabase
        .from("phone_images")
        .delete()
        .eq("phone_id", phoneId);

      // Then insert new images
      if (imageUrls.length > 0) {
        const images = imageUrls.map((url, index) => ({
          phone_id: phoneId,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error } = await supabase
          .from("phone_images")
          .insert(images);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["phone-images", variables.phoneId] });
      queryClient.invalidateQueries({ queryKey: ["phones"] });
    },
    onError: (error) => {
      toast.error("Rasmlarni saqlashda xatolik: " + error.message);
    },
  });
}
