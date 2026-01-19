import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Messages() {
  const { user, loading: isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const phoneId = searchParams.get("phoneId");
  const sellerId = searchParams.get("sellerId");

  // Fetch phone and seller details if we have phoneId and sellerId
  const { data: chatInfo } = useQuery({
    queryKey: ["chat-info", phoneId, sellerId],
    queryFn: async () => {
      if (!phoneId || !sellerId) return null;

      // Get phone info
      const { data: phone } = await supabase
        .from("phones")
        .select("name")
        .eq("id", phoneId)
        .single();

      // Get seller profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", sellerId)
        .single();

      return {
        phoneName: phone?.name || "Telefon",
        sellerName: profile?.full_name || "Sotuvchi",
      };
    },
    enabled: !!phoneId && !!sellerId && !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

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

  // If we have phoneId and sellerId, show chat directly
  if (phoneId && sellerId && user && chatInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/messages")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Barcha xabarlar
          </Button>

          <ChatWindow
            phoneId={phoneId}
            otherUserId={sellerId}
            phoneName={chatInfo.phoneName}
            otherUserName={chatInfo.sellerName}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Xabarlar</h1>
              <p className="text-sm text-muted-foreground">
                Barcha suhbatlaringiz shu yerda
              </p>
            </div>
          </div>
        </div>

        <ConversationList />
      </main>
    </div>
  );
}
