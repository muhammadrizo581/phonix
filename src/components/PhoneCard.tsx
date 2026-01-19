import { Phone, CONDITION_OPTIONS, APPLE_BRAND_ID } from "@/hooks/usePhones";
import { Edit2, Trash2, Heart, Smartphone, Battery } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
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
  const { data: favorites } = useFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();
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
  
  const isFavorite = favorites?.includes(phone.id) ?? false;
  const canEdit = user && (user.id === phone.owner_id || isAdmin);
  const isApple = phone.brand_id === APPLE_BRAND_ID;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sevimlilarga qo'shish uchun tizimga kiring");
      navigate("/auth");
      return;
    }
    toggleFavorite.mutate({ phoneId: phone.id, userId: user.id, isFavorite });
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
      className="group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={phone.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Smartphone className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Favorite button */}
        <button 
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors ${
            isFavorite 
              ? "bg-primary text-primary-foreground" 
              : "bg-card/80 hover:bg-card text-muted-foreground hover:text-primary"
          }`}
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {/* Battery health badge for Apple phones */}
        {isApple && phone.battery_health !== null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-foreground">
            <Battery className="h-3 w-3 text-green-500" />
            {phone.battery_health}%
          </div>
        )}

        {/* Edit/Delete buttons */}
        {showActions && canEdit && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/phones/${phone.id}/edit`);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-card/90 backdrop-blur-sm text-destructive hover:bg-card"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(phone.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="mt-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-normal text-foreground line-clamp-2 leading-tight">
            {phone.name} {phone.storage}
          </h3>
        </div>
        
        <p className="text-base font-bold text-foreground">
          {formattedPrice}
        </p>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{phone.city}</span>
          <span>·</span>
          <span>{conditionLabel}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
