import { useConversations, Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { MessageCircle, Smartphone } from "lucide-react";

export function ConversationList() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="font-semibold text-lg mb-2">Hali xabarlar yo'q</h3>
        <p className="text-muted-foreground">
          Telefon e'lonlariga xabar yozing yoki sizga xabar kelishini kuting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button
          key={`${conv.phone_id}-${conv.other_user_id}`}
          onClick={() => navigate(`/chat/${conv.phone_id}/${conv.other_user_id}`)}
          className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          {/* Phone image or fallback */}
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            {conv.phone_image ? (
              <img
                src={conv.phone_image}
                alt={conv.phone_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold truncate">{conv.other_user_name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conv.last_message_at), {
                  addSuffix: true,
                  locale: uz,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-1">
              {conv.phone_name}
            </p>
            <p className="text-sm truncate">{conv.last_message}</p>
          </div>

          {conv.unread_count > 0 && (
            <Badge variant="default" className="flex-shrink-0">
              {conv.unread_count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
