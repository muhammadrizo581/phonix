import { Header } from "@/components/Header";
import { PhoneGrid } from "@/components/PhoneGrid";
import { useAuth } from "@/hooks/useAuth";
import { useLikedPhones } from "@/hooks/useLikedPhones";

export default function LikesPage() {
  const { user } = useAuth();
  const { data: phones = [], isLoading } = useLikedPhones(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[env(safe-area-inset-top)] bg-card" />
      <Header />

      <main className="px-4 py-5 pb-[env(safe-area-inset-bottom)]">
        {!isLoading && phones.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            Hozircha yoqtirilgan e’lonlar yo‘q ❤️
          </div>
        )}

        <PhoneGrid phones={phones} isLoading={isLoading} />
      </main>
    </div>
  );
}
