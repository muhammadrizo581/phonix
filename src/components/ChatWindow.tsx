import { useState, useEffect, useRef } from "react";
import {
  usePhoneMessages,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
  useUpdateMessage,
  Message,
} from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Loader2,
  ImagePlus,
  X,
  Trash2,
  Edit2,
  Check,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatWindowProps {
  phoneId: string;
  otherUserId: string;
  phoneName: string;
  otherUserName: string;
}

export function ChatWindow({
  phoneId,
  otherUserId,
  phoneName,
  otherUserName,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = usePhoneMessages(
    phoneId,
    otherUserId,
    user?.id
  );

  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();
  const updateMessage = useUpdateMessage();

  /* ================= SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= MARK AS READ ================= */
  useEffect(() => {
    if (!messages || !user) return;

    const unreadIds = messages
      .filter((m) => m.receiver_id === user.id && !m.is_read)
      .map((m) => m.id);

    if (unreadIds.length) {
      markAsRead.mutate({ messageIds: unreadIds });
    }
  }, [messages, user]);

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !user) return;

    const files = Array.from(e.target.files).slice(
      0,
      5 - pendingImages.length
    );

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        const path = `chat/${user.id}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from("phone-images")
          .upload(path, file);

        if (error) continue;

        const { data } = supabase.storage
          .from("phone-images")
          .getPublicUrl(path);

        uploaded.push(data.publicUrl);
      }

      setPendingImages((p) => [...p, ...uploaded]);
    } catch {
      toast.error("Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ================= SEND ================= */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!message.trim() && !pendingImages.length)) return;

    await sendMessage.mutateAsync({
      phoneId,
      receiverId: otherUserId,
      content: message.trim(),
      imageUrls: pendingImages.length ? pendingImages : undefined,
    });

    setMessage("");
    setPendingImages([]);
  };

  /* ================= UI ================= */
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col rounded-xl border bg-card">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar>
          <AvatarFallback>
            {otherUserName?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{otherUserName}</p>
          <p className="text-xs text-muted-foreground">
            {phoneName} haqida
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages?.map((msg) => {
          const isOwn = msg.sender_id === user?.id;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] overflow-hidden rounded-2xl",
                  isOwn
                    ? "bg-[#1FA97C] text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {/* IMAGES */}
                {msg.image_urls && msg.image_urls.length > 0 && (
                  <div
                    className={cn(
                      "grid overflow-hidden",
                      msg.image_urls.length > 1
                        ? "grid-cols-2 gap-0.5"
                        : "grid-cols-1"
                    )}
                  >
                    {msg.image_urls.map((url, i) => (
                      <Dialog key={i}>
                        <DialogTrigger asChild>
                          <button className="block overflow-hidden bg-black">
                            <img
                              src={url}
                              className="aspect-[4/5] w-full object-cover"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-black p-0">
                          <img
                            src={url}
                            className="w-full object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}

                {/* TEXT */}
                {msg.content && (
                  <div className="px-3 py-2">
                    <p className="text-sm break-words">
                      {msg.content}
                    </p>

                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-80">
                      <span>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </span>
                      {isOwn &&
                        (msg.is_read ? (
                          <IoCheckmarkDoneOutline className="h-4 w-4 text-blue-300" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleImageUpload}
          />

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Xabar yozing..."
          />

          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
