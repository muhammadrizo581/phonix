import { Phone, CONDITION_OPTIONS, APPLE_BRAND_ID } from "@/hooks/usePhones";
import { Edit2, Trash2, Heart, Smartphone, Battery } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLikedPhoneIds, useToggleLike } from "@/hooks/useLikedPhones";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PhoneCardProps {
  phone: Phone;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function PhoneCard({ phone, onDelete, showActions = true }: PhoneCardProps) {
  const { user, isAdmin } = useAuth();
  const { data: likedPhoneIds = [] } = useLikedPhoneIds(user?.id);
  const toggleLike = useToggleLike();
  const navigate = useNavigate();
  
  // Fetch first image for this phone
  const { data: phoneImages } = useQuery({
    queryKey: ["phone-images", phone.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_images")
        .select("image_url")
        .eq("phone_id", phone.id)
        .order("display_order", { ascending: true })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
  });

  const imageUrl = phoneImages?.[0]?.image_url;
  
  const isLiked = likedPhoneIds.includes(phone.id);
  const canEdit = user && (user.id === phone.owner_id || isAdmin);
  const isApple = phone.brand_id === APPLE_BRAND_ID;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Yoqtirish uchun tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleLike.mutate({
      phoneId: phone.id,
      userId: user.id,
      isLiked,
    });
  };
  
  const formattedPrice = new Intl.NumberFormat("uz-UZ").format(phone.price) + " $";
  
  const timeAgo = formatDistanceToNow(new Date(phone.created_at), { 
    addSuffix: false, 
    locale: uz 
  });

  const conditionLabel = CONDITION_OPTIONS.find(c => c.value === phone.condition)?.label || phone.condition;

  const handleCardClick = () => {
    navigate(`/phones/${phone.id}`);
  };

return (
  <div
    onClick={handleCardClick}
    className="group cursor-pointer rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow"
  >
    {/* IMAGE */}
    <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-muted">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={phone.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Smartphone className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* LIKE */}
      <button
        onClick={handleLikeClick}
        disabled={toggleLike.isPending}
        className={`absolute top-3 right-3 z-10 rounded-full p-2 backdrop-blur-md transition ${
          isLiked
            ? "bg-red-500 text-white"
            : "bg-white/80 text-muted-foreground hover:text-red-500"
        }`}
      >
        <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
      </button>

      {/* BATTERY */}
      {isApple && phone.battery_health !== null && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium">
          <Battery className="h-3 w-3 text-green-500" />
          {phone.battery_health}%
        </div>
      )}
    </div>

    {/* CONTENT */}
    <div className="space-y-1.5 p-3">
      <h3 className="line-clamp-2 text-sm font-medium leading-snug">
        {phone.name} {phone.storage}
      </h3>

      <p className="text-base font-bold text-primary">
        {formattedPrice}
      </p>

      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <span>{phone.city}</span>
        <span>•</span>
        <span>{conditionLabel}</span>
        <span>•</span>
        <span>{timeAgo}</span>
      </div>
    </div>
  </div>
);

}