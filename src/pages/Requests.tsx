import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { PhoneRequestForm } from "@/components/PhoneRequestForm";
import { useAuth } from "@/hooks/useAuth";
import { usePhoneRequests, useDeletePhoneRequest, useTogglePhoneRequest } from "@/hooks/usePhoneRequests";
import { useBrands } from "@/hooks/useBrands";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bell, Trash2, Search, MapPin, HardDrive, ThermometerSun, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { PhoneCondition } from "@/hooks/usePhones";

export default function Requests() {
  const { user, loading: isLoading } = useAuth();
  const navigate = useNavigate();
  const { data: requests, isLoading: requestsLoading } = usePhoneRequests(user?.id);
  const { data: brands } = useBrands();
  const deleteRequest = useDeletePhoneRequest();
  const toggleRequest = useTogglePhoneRequest();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || requestsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat("en-US").format(price) + " y.e.";
  };

  const conditionLabels: Record<PhoneCondition, string> = {
    yaxshi: "Yaxshi",
    ortacha: "O'rtacha",
    yaxshi_emas: "Yaxshi emas",
  };

  const getBrandName = (brandId: string | null) => {
    if (!brandId || !brands) return null;
    return brands.find(b => b.id === brandId)?.name || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Telefon so'rovlari</h1>
              <p className="text-sm text-muted-foreground">
                O'xshash telefon e'lon qilinganda xabar olasiz
              </p>
            </div>
          </div>
          <PhoneRequestForm />
        </div>

        {requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`rounded-lg border p-4 transition-colors ${
                  request.is_active
                    ? "border-border bg-card"
                    : "border-border/50 bg-card/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-foreground">{request.keywords}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {request.brand_id && (
                        <span className="rounded-full bg-muted px-2 py-0.5 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {getBrandName(request.brand_id)}
                        </span>
                      )}
                      {request.city && (
                        <span className="rounded-full bg-muted px-2 py-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {request.city}
                        </span>
                      )}
                      {request.storage && (
                        <span className="rounded-full bg-muted px-2 py-0.5 flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {request.storage}
                        </span>
                      )}
                      {request.condition && (
                        <span className="rounded-full bg-muted px-2 py-0.5 flex items-center gap-1">
                          <ThermometerSun className="h-3 w-3" />
                          {conditionLabels[request.condition]}
                        </span>
                      )}
                      {(request.min_price || request.max_price) && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {request.min_price && request.max_price
                            ? `${formatPrice(request.min_price)} - ${formatPrice(request.max_price)}`
                            : request.min_price
                            ? `${formatPrice(request.min_price)} dan`
                            : `${formatPrice(request.max_price)} gacha`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Yaratilgan: {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: uz,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {request.is_active ? "Faol" : "O'chirilgan"}
                      </span>
                      <Switch
                        checked={request.is_active}
                        onCheckedChange={(checked) =>
                          toggleRequest.mutate({ id: request.id, is_active: checked })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteRequest.mutate(request.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-base font-medium text-foreground">Hozircha so'rovlar yo'q</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Qidirayotgan telefoningizni so'rov qilib qo'ying!
            </p>
            <PhoneRequestForm />
          </div>
        )}
      </main>
    </div>
  );
}
