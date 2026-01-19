import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePhones, useUpdatePhone, PhoneFormData } from "@/hooks/usePhones";
import { useSavePhoneImages } from "@/hooks/usePhoneImages";
import { PhoneForm } from "@/components/PhoneForm";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function EditPhone() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: phones, isLoading: phonesLoading } = usePhones();
  const updatePhone = useUpdatePhone();
  const savePhoneImages = useSavePhoneImages();

  const { data: phoneImages } = useQuery({
    queryKey: ["phone-images", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("phone_images")
        .select("image_url")
        .eq("phone_id", id)
        .order("display_order", { ascending: true });
      return data?.map((img) => img.image_url) || [];
    },
    enabled: !!id,
  });

  const phone = phones?.find((p) => p.id === id);
  const canEdit = user && phone && (user.id === phone.owner_id || isAdmin);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!phonesLoading && !phone) {
      toast.error("Telefon topilmadi");
      navigate("/");
    }
  }, [phone, phonesLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !phonesLoading && phone && user && !canEdit) {
      toast.error("Bu e'lonni tahrirlash huquqingiz yo'q");
      navigate("/");
    }
  }, [canEdit, authLoading, phonesLoading, phone, user, navigate]);

  const handleSubmit = async (data: PhoneFormData, images: string[]) => {
    if (!id) return;
    await updatePhone.mutateAsync({ id, ...data });
    await savePhoneImages.mutateAsync({ phoneId: id, imageUrls: images });
    navigate("/");
  };

  if (authLoading || phonesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !phone || !canEdit) return null;

  const defaultImages = phoneImages && phoneImages.length > 0 
    ? phoneImages 
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <div className="animate-fade-in">
          <h1 className="mb-2 font-display text-3xl font-bold">E'lonni tahrirlash</h1>
          <p className="mb-8 text-muted-foreground">
            Telefon e'loni ma'lumotlarini yangilang
          </p>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <PhoneForm
              defaultValues={{
                name: phone.name,
                description: phone.description || undefined,
                price: phone.price,
                storage: phone.storage,
                condition: phone.condition,
                city: phone.city,
              }}
              defaultImages={defaultImages}
              onSubmit={handleSubmit}
              isSubmitting={updatePhone.isPending || savePhoneImages.isPending}
              submitLabel="E'lonni yangilash"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
