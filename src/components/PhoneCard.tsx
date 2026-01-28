import { Phone, CONDITION_OPTIONS, APPLE_BRAND_ID } from "@/hooks/usePhones";
import { Edit2, Trash2, Heart, Smartphone, Battery } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLikedPhoneIds, useToggleLike } from "@/hooks/useLikedPhones";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { toast } from "sonner";

/* ================= TYPES ================= */

interface PhoneImage {
  image_url: string;
  is_primary?: boolean;
  display_order?: number;
}

interface PhoneWithImages extends Phone {
  phone_images?: PhoneImage[];
}

interface PhoneCardProps {
  phone: PhoneWithImages;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

/* ================= COMPONENT ================= */

export function PhoneCard({
  phone,
  onDelete,
  showActions = true,
}: PhoneCardProps) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: likedIds = [] } = useLikedPhoneIds(user?.id);
  const toggleLike = useToggleLike();

  const isLiked = likedIds.includes(phone.id);
  const canEdit = !!user && (user.id === phone.owner_id || isAdmin);
  const isApple = phone.brand_id === APPLE_BRAND_ID;

  /* ===== IMAGE PICKER ===== */
  const imageUrl =
    phone.phone_images
      ?.slice()
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.display_order ?? 0) - (b.display_order ?? 0);
      })[0]?.image_url ?? null;

  /* ================= HANDLERS ================= */

  const handleCardClick = () => {
    navigate(`/phones/${phone.id}`);
  };

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  /* ================= HELPERS ================= */

  const formattedPrice =
    new Intl.NumberFormat("en-US").format(phone.price) + " $";

  const timeAgo = formatDistanceToNow(new Date(phone.created_at), {
    addSuffix: false,
    locale: uz,
  });

  const conditionLabel =
    CONDITION_OPTIONS.find((c) => c.value === phone.condition)?.label ??
    phone.condition;

  /* ================= RENDER ================= */

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-xl bg-card shadow-sm transition "
    >
      {/* IMAGE */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-muted">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={phone.name}
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-500 "
            />
            {/* gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Smartphone className="h-14 w-14 text-muted-foreground/40" />
          </div>
        )}

        {/* LIKE */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={toggleLike.isPending}
          className={`absolute right-2 top-2 z-10 rounded-full p-2 backdrop-blur-md transition ${
            isLiked
              ? "bg-red-500 text-white"
              : "bg-white/80 text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </button>

        {/* BATTERY */}
        {isApple && phone.battery_health !== null && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium">
            <Battery className="h-3 w-3 text-green-500" />
            {phone.battery_health}%
          </div>
        )}

        {/* EDIT / DELETE */}
        {showActions && canEdit && (
          <div className="absolute left-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/phones/${phone.id}/edit`);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 text-destructive"
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

      {/* CONTENT */}
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {phone.name} {phone.storage}
        </h3>

        <p className="text-base font-bold text-primary">
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
