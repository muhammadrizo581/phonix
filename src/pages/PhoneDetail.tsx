import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, Smartphone, MapPin, HardDrive, CheckCircle, Battery } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDeletePhone, Phone, CONDITION_OPTIONS, APPLE_BRAND_ID } from "@/hooks/usePhones";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PhoneImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export default function PhoneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const deletePhone = useDeletePhone();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: phone, isLoading } = useQuery({
    queryKey: ["phone", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("phones")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch owner profile separately
      let ownerProfile = null;
      if (data?.owner_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", data.owner_id)
          .single();
        ownerProfile = profileData;
      }

      return { ...data, owner_profile: ownerProfile } as Phone & { owner_profile: { full_name: string | null; avatar_url: string | null } | null };
    },
    enabled: !!id,
  });

  const { data: phoneImages } = useQuery({
    queryKey: ["phone-images", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("phone_images")
        .select("*")
        .eq("phone_id", id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PhoneImage[];
    },
    enabled: !!id,
  });

  const allImages = phoneImages && phoneImages.length > 0
    ? phoneImages.map((img) => img.image_url)
    : [];

  const canEdit = user && phone && (user.id === phone.owner_id || isAdmin);
  const isOwnPhone = user?.id === phone?.owner_id;
  const isApple = phone?.brand_id === APPLE_BRAND_ID;

  const formattedPrice = phone
    ? new Intl.NumberFormat("uz-UZ").format(phone.price) + " $"
    : "";

  const conditionLabel = phone 
    ? CONDITION_OPTIONS.find(c => c.value === phone.condition)?.label || phone.condition 
    : "";

  const handleDelete = () => {
    if (!phone) return;
    if (confirm("Rostdan ham bu e'lonni o'chirmoqchimisiz?")) {
      deletePhone.mutate(phone.id, {
        onSuccess: () => navigate("/"),
      });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Telefon topilmadi</p>
        </div>
      </div>
    );
  }

  // Calculate how many specs to show (3 or 4 if battery health exists)
  const showBattery = isApple && phone.battery_health !== null;
  const gridCols = showBattery ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/30 border border-border">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[currentImageIndex]}
                    alt={phone.name}
                    className="h-full w-full object-cover"
                  />
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-primary/20"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-primary/20"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={cn(
                              "h-2 w-2 rounded-full transition-all",
                              idx === currentImageIndex
                                ? "w-6 bg-primary"
                                : "bg-foreground/50 hover:bg-foreground/75"
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                  <Smartphone className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                      idx === currentImageIndex
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{phone.name}</h1>
              <p className="mt-2 font-display text-4xl font-bold text-primary">
                {formattedPrice}
              </p>
            </div>

            {/* Specs */}
            <div className={`grid ${gridCols} gap-4`}>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <HardDrive className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Xotira</p>
                <p className="font-semibold text-foreground">{phone.storage}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <CheckCircle className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Holati</p>
                <p className="font-semibold text-foreground">{conditionLabel}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Shahar</p>
                <p className="font-semibold text-foreground">{phone.city}</p>
              </div>
              {showBattery && (
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <Battery className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Batareyka</p>
                  <p className="font-semibold text-foreground">{phone.battery_health}%</p>
                </div>
              )}
            </div>

            {phone.description && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 font-semibold text-foreground">Tavsif</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {phone.description}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold text-foreground">Sotuvchi</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <span className="text-lg font-semibold text-primary">
                    {phone.owner_profile?.full_name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {phone.owner_profile?.full_name || "Foydalanuvchi"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    E'lon qo'yildi: {format(new Date(phone.created_at), "dd.MM.yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 flex-1 border-border hover:bg-primary/10 hover:border-primary/50"
                  onClick={() => navigate(`/phones/${phone.id}/edit`)}
                >
                  <Edit2 className="h-5 w-5" />
                  Tahrirlash
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="gap-2 flex-1"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-5 w-5" />
                  O'chirish
                </Button>
              </div>
            )}

            {/* Message button - only show if not own phone and user is logged in */}
            {!isOwnPhone && user && phone && (
              <Button
                size="lg"
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                onClick={() => navigate(`/messages?phoneId=${phone.id}&sellerId=${phone.owner_id}`)}
              >
                <MessageCircle className="h-5 w-5" />
                Xabar yuborish
              </Button>
            )}

            {/* Login prompt for non-authenticated users */}
            {!user && (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Sotuvchi bilan bog'laning</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Xabar yuborish uchun tizimga kiring
                </p>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="shadow-button bg-primary hover:bg-primary/90"
                >
                  Kirish
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
