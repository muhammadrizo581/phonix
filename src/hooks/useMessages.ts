import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  phone_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  image_urls?: string[] | null;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  phone_id: string;
  phone_name: string;
  phone_image: string | null;
  other_user_id: string;
  other_user_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          phones:phone_id (
            id,
            name,
            owner_id
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by phone and other user
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messages || []) {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const key = `${msg.phone_id}-${otherUserId}`;

        if (!conversationMap.has(key)) {
          const phone = msg.phones as { id: string; name: string; owner_id: string };
          
          // Get other user's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", otherUserId)
            .single();

          // Get phone's first image
          const { data: phoneImages } = await supabase
            .from("phone_images")
            .select("image_url")
            .eq("phone_id", msg.phone_id)
            .order("display_order", { ascending: true })
            .limit(1);

          conversationMap.set(key, {
            phone_id: msg.phone_id,
            phone_name: phone?.name || "Unknown Phone",
            phone_image: phoneImages?.[0]?.image_url || null,
            other_user_id: otherUserId,
            other_user_name: profile?.full_name || "Unknown User",
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }

        const conv = conversationMap.get(key)!;
        if (msg.receiver_id === userId && !msg.is_read) {
          conv.unread_count++;
        }
      }

      return Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
    enabled: !!userId,
  });

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Refresh if this user is involved
          if (newMessage.sender_id === userId || newMessage.receiver_id === userId) {
            queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// Hook to get total unread count for header badge
export function useUnreadCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function usePhoneMessages(phoneId: string, otherUserId: string, currentUserId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", phoneId, otherUserId],
    queryFn: async () => {
      if (!currentUserId) return [];

      const { data: messagesOnly, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("phone_id", phoneId)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;
      return messagesOnly as Message[];
    },
    enabled: !!currentUserId && !!phoneId && !!otherUserId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUserId || !phoneId) return;

    const channel = supabase
      .channel(`messages-${phoneId}-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `phone_id=eq.${phoneId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's part of this conversation
          if (
            (newMessage.sender_id === currentUserId && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUserId)
          ) {
            queryClient.invalidateQueries({ queryKey: ["messages", phoneId, otherUserId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phoneId, otherUserId, currentUserId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phoneId,
      receiverId,
      content,
      imageUrls,
    }: {
      phoneId: string;
      receiverId: string;
      content: string;
      imageUrls?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          phone_id: phoneId,
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          image_urls: imageUrls || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.phoneId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds }: { messageIds: string[] }) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", messageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
