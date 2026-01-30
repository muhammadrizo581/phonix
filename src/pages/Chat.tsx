import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ChatWindow } from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PhoneInfo {
  id: string;
  name: string;
  owner_id: string;
}

interface ProfileInfo {
  full_name: string | null;
}

export default function Chat() {
  const { phoneId, otherUserId } = useParams<{ phoneId: string; otherUserId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState<PhoneInfo | null>(null);
  const [otherUser, setOtherUser] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!phoneId || !otherUserId) return;

      try {
        // Fetch phone info
        const { data: phoneData } = await supabase
          .from("phones")
          .select("id, name, owner_id")
          .eq("id", phoneId)
          .single();

        if (phoneData) {
          setPhone(phoneData);
        }

        // Fetch other user's profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", otherUserId)
          .single();

        if (profileData) {
          setOtherUser(profileData);
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [phoneId, otherUserId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!phoneId || !otherUserId || !phone) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Chat topilmadi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>

        <ChatWindow
          phoneId={phoneId}
          otherUserId={otherUserId}
          phoneName={phone.name}
          otherUserName={otherUser?.full_name || "Foydalanuvchi"}
        />
      </main>
    </div>
  );
}
