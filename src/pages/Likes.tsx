import { useAuth } from "@/hooks/useAuth";
import { useLikedPhones } from "@/hooks/useLikedPhones";
import { Header } from "@/components/Header";
import { PhoneCard } from "@/components/PhoneCard";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LikesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: likedPhones, isLoading } = useLikedPhones(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[env(safe-area-inset-top)] bg-card" />
        <Header />
        <main className="container py-8 pb-24 md:pb-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Heart className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="text-2xl font-bold text-foreground">Yoqtirilganlarni ko'rish</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Yoqtirilgan telefonlarni ko'rish uchun tizimga kiring
            </p>
            <Button onClick={() => navigate("/auth")} size="lg" className="gap-2">
              <Heart className="h-5 w-5" />
              Kirish
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[env(safe-area-inset-top)] bg-card" />
      <Header />
      
      <main className="container py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Yoqtirilgan telefonlar
          </h1>
          <p className="text-muted-foreground mt-2">
            Siz yoqtirgan barcha telefonlar
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : likedPhones && likedPhones.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {likedPhones.map((phone) => (
              <PhoneCard key={phone.id} phone={phone} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <Heart className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">Yoqtirilganlar yo'q</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Hali birorta telefon yoqtirmadingiz. Telefonlarni ko'rib chiqing va yoqtirganlaringizni saqlang!
            </p>
            <Button onClick={() => navigate("/")} size="lg" className="gap-2">
              Telefonlarni ko'rish
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}