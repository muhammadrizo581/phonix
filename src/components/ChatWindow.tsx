import { useState, useEffect, useRef } from "react";
import { usePhoneMessages, useSendMessage, useMarkAsRead, useDeleteMessage, useUpdateMessage, Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, ImagePlus, X, Trash2, Edit2, Check, MoreVertical, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export function ChatWindow({ phoneId, otherUserId, phoneName, otherUserName }: ChatWindowProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = usePhoneMessages(phoneId, otherUserId, user?.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();
  const updateMessage = useUpdateMessage();

  const prevMessageCountRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only scroll when new messages are added, not on edits
  useEffect(() => {
    const currentCount = messages?.length || 0;
    if (currentCount > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = currentCount;
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (messages && user) {
      const unreadMessageIds = messages
        .filter((msg) => msg.receiver_id === user.id && !msg.is_read)
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        markAsRead.mutate({ messageIds: unreadMessageIds });
      }
    }
  }, [messages, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const remainingSlots = 5 - pendingImages.length;
    if (files.length > remainingSlots) {
      toast.error(`Maksimum 5 ta rasm yuklash mumkin`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files).slice(0, remainingSlots)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("phone-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("phone-images")
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        setPendingImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Rasm yuklashda xatolik" + error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && pendingImages.length === 0) || !user) return;

    await sendMessage.mutateAsync({
      phoneId,
      receiverId: otherUserId,
      content: message.trim() || (pendingImages.length > 0 ? "" : ""),
      imageUrls: pendingImages.length > 0 ? pendingImages : undefined,
    });

    setMessage("");
    setPendingImages([]);
  };

  const handleDelete = async (msgId: string) => {
    if (confirm("Xabarni o'chirmoqchimisiz?")) {
      await deleteMessage.mutateAsync(msgId);
    }
  };

  const handleEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setMessage(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !message.trim()) return;
    try {
      await updateMessage.mutateAsync({
        messageId: editingMessageId,
        content: message.trim(),
      });
      toast.success("Xabar tahrirlandi");
      setEditingMessageId(null);
      setMessage("");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Xabarni tahrirlashda xatolik");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessage("");
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[400px] flex-col rounded-lg border bg-card">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{otherUserName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserName || "Foydalanuvchi"}</h3>
            <p className="text-sm text-muted-foreground">{phoneName} haqida</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Hali xabarlar yo'q. Birinchi bo'lib yozing!</p>
          </div>
        )}

        {messages?.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          const isEditing = editingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={cn(
                "group flex",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div className="relative max-w-[70%]">
                {/* Message actions for own messages */}
                {isOwn && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -left-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleEdit(msg)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  {/* Images */}
                  {msg.image_urls && msg.image_urls.length > 0 && (
                    <div className={cn(
                      "mb-2 grid gap-1",
                      msg.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {msg.image_urls.map((url, idx) => (
                        <Dialog key={idx}>
                          <DialogTrigger asChild>
                            <button className="overflow-hidden rounded-lg">
                              <img
                                src={url}
                                alt={`Image ${idx + 1}`}
                                className="h-32 w-full object-cover transition-transform hover:scale-105"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0">
                            <img
                              src={url}
                              alt={`Image ${idx + 1}`}
                              className="h-auto w-full rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}

                  <p className={cn(
                    "break-words",
                    isEditing && "bg-primary/20 rounded px-1"
                  )}>{msg.content}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-xs",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                    {isOwn && (
                      <span className="ml-0.5">
                        {msg.is_read ? (
                          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="border-t p-2">
          <div className="flex gap-2 overflow-x-auto">
            {pendingImages.map((url, idx) => (
              <div key={idx} className="relative h-16 w-16 flex-shrink-0">
                <img
                  src={url}
                  alt={`Pending ${idx + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5"
                  onClick={() => handleRemoveImage(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editing indicator */}
      {editingMessageId && (
        <div className="border-t bg-muted/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Edit2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Xabarni tahrirlash</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={editingMessageId ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSend} className="border-t p-4">
        <div className="flex gap-2">
          {!editingMessageId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || pendingImages.length >= 5}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={editingMessageId ? "Xabarni tahrirlang..." : "Xabar yozing..."}
            className="flex-1"
            autoFocus={!!editingMessageId}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() && !editingMessageId && pendingImages.length === 0}
          >
            {sendMessage.isPending || updateMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingMessageId ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
