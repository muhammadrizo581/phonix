import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChatButtonProps {
  phoneId: string;
  ownerId: string;
  phoneName: string;
}

export function ChatButton({ phoneId, ownerId, phoneName }: ChatButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleChat = () => {
    if (!user) {
      toast({
        title: "Tizimga kiring",
        description: "Xabar yuborish uchun tizimga kirishingiz kerak",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (user.id === ownerId) {
      toast({
        title: "Bu sizning e'loningiz",
        description: "O'zingizga xabar yubora olmaysiz",
      });
      return;
    }

    navigate(`/chat/${phoneId}/${ownerId}`);
  };

  return (
    <Button
      onClick={handleChat}
      className="gap-2"
      variant="secondary"
    >
      <MessageCircle className="h-4 w-4" />
      Xabar yozish
    </Button>
  );
}
