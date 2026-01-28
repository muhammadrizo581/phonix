import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageCircle,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  MapPin,
  HardDrive,
  CheckCircle,
  Battery,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeletePhone,
  Phone,
  CONDITION_OPTIONS,
  APPLE_BRAND_ID,
} from "@/hooks/usePhones";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PhoneImage {
  id: string;
  image_url: string;
  display_order: number;
}

export default function PhoneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const deletePhone = useDeletePhone();

  const [currentImage, setCurrentImage] = useState(0);
  const [imageError, setImageError] = useState(false);

  /* ================= DATA ================= */

  const { data: phone, isLoading } = useQuery({
    queryKey: ["phone", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phones")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      let ownerProfile = null;
      if (data.owner_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", data.owner_id)
          .single();
        ownerProfile = profile;
      }

      return { ...data, owner_profile: ownerProfile } as Phone & {
        owner_profile: { full_name: string | null; avatar_url: string | null } | null;
      };
    },
    enabled: !!id,
  });

  const { data: images = [] } = useQuery({
    queryKey: ["phone-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_images")
        .select("*")
        .eq("phone_id", id!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PhoneImage[];
    },
    enabled: !!id,
  });

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!phone) {
    return <div className="text-center py-10">Telefon topilmadi</div>;
  }

  const canEdit = user && (user.id === phone.owner_id || isAdmin);
  const isOwnPhone = user?.id === phone.owner_id;
  const isApple = phone.brand_id === APPLE_BRAND_ID;

  const formattedPrice =
    new Intl.NumberFormat("uz-UZ").format(phone.price) + " $";

  const conditionLabel =
    CONDITION_OPTIONS.find((c) => c.value === phone.condition)?.label ||
    phone.condition;

  /* ================= ACTIONS ================= */

  const next = () => setCurrentImage((i) => (i + 1) % images.length);
  const prev = () => setCurrentImage((i) => (i - 1 + images.length) % images.length);

  const handleDelete = () => {
    if (!confirm("E'lonni o‘chirmoqchimisiz?")) return;
    deletePhone.mutate(phone.id, {
      onSuccess: () => navigate("/"),
    });
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="h-[env(safe-area-inset-top)] bg-card" />
      <Header />

      <main className="container max-w-5xl py-6 space-y-6 mb-14">
        {/* BACK */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ================= IMAGE ================= */}
          <div className="space-y-3">
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted shadow-sm">
              {images.length > 0 && !imageError ? (
                <>
                  <img
                    src={images[currentImage].image_url}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {images.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <ChevronRight />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Smartphone className="h-16 w-16 mb-2" />
                  Rasm yo‘q
                </div>
              )}
            </div>

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setCurrentImage(i);
                      setImageError(false);
                    }}
                    className={cn(
                      "h-16 w-16 rounded-xl overflow-hidden transition",
                      i === currentImage
                        ? "ring-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img.image_url} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= INFO ================= */}
          <div className="space-y-5">
            {/* TITLE */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {phone.name}
              </h1>
              <p className="mt-1 text-3xl font-bold text-primary">
                {formattedPrice}
              </p>
            </div>

            {/* SPECS */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <HardDrive className="h-3 w-3" /> {phone.storage}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" /> {conditionLabel}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" /> {phone.city}
              </Badge>
              {isApple && phone.battery_health !== null && (
                <Badge variant="secondary" className="gap-1">
                  <Battery className="h-3 w-3 text-green-500" />
                  {phone.battery_health}%
                </Badge>
              )}
            </div>

            {/* DESCRIPTION */}
            {phone.description && (
              <div className="rounded-xl bg-muted/40 p-4">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Tavsif
                </h3>
                <p className="text-sm leading-relaxed">{phone.description}</p>
              </div>
            )}

            {/* SELLER */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                {phone.owner_profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium">
                  {phone.owner_profile?.full_name || "Foydalanuvchi"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(phone.created_at), "dd.MM.yyyy")}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => navigate(`/phones/${phone.id}/edit`)}
                >
                  <Edit2 className="h-4 w-4" /> Tahrirlash
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" /> O‘chirish
                </Button>
              </div>
            )}

            {!isOwnPhone && user && (
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() =>
                  navigate(`/messages?phoneId=${phone.id}&sellerId=${phone.owner_id}`)
                }
              >
                <MessageCircle className="h-5 w-5" />
                Xabar yuborish
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
