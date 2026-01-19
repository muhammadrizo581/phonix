import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePhone, PhoneFormData } from "@/hooks/usePhones";
import { useSavePhoneImages } from "@/hooks/usePhoneImages";
import { PhoneForm } from "@/components/PhoneForm";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Smartphone } from "lucide-react";
import { useEffect } from "react";

export default function CreatePhone() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const createPhone = useCreatePhone();
  const savePhoneImages = useSavePhoneImages();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (data: PhoneFormData, images: string[]) => {
    if (!user) return;
    
    const phone = await createPhone.mutateAsync({ ...data, owner_id: user.id });
    
    if (images.length > 0) {
      await savePhoneImages.mutateAsync({ phoneId: phone.id, imageUrls: images });
    }
    
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Telefon sotish</h1>
              <p className="text-muted-foreground">
                Telefoningizni sotish uchun e'lon yarating
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <PhoneForm
              onSubmit={handleSubmit}
              isSubmitting={createPhone.isPending || savePhoneImages.isPending}
              submitLabel="E'lon yaratish"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
