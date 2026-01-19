import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePhones } from "@/hooks/usePhones";
import { PhoneGrid } from "@/components/PhoneGrid";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2, Package } from "lucide-react";
import { useEffect } from "react";

export default function MyListings() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: allPhones, isLoading: phonesLoading } = usePhones();

  const myPhones = allPhones?.filter((phone) => phone.owner_id === user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
      <main className="container py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Bosh sahifaga
        </Button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-fade-in flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mening e'lonlarim</h1>
              <p className="text-muted-foreground">
                E'lonlaringizni boshqaring
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/phones/new")}
            className="gap-2 shadow-button bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Yangi e'lon
          </Button>
        </div>

        <PhoneGrid phones={myPhones} isLoading={phonesLoading} />
      </main>
    </div>
  );
}
