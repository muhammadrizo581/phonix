import { Phone, useDeletePhone } from "@/hooks/usePhones";
import { PhoneCard } from "./PhoneCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Smartphone } from "lucide-react";

interface PhoneGridProps {
  phones: Phone[] | undefined;
  isLoading: boolean;
  showActions?: boolean;
}

export function PhoneGrid({ phones, isLoading, showActions = true }: PhoneGridProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deletePhone = useDeletePhone();

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deletePhone.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] rounded-lg bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!phones?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Smartphone className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-base font-medium text-foreground">Hozircha e'lonlar yo'q</h3>
        <p className="text-sm text-muted-foreground">
          Birinchi bo'lib telefon sotishga e'lon qo'ying!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {phones.map((phone, index) => (
          <div
            key={phone.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <PhoneCard phone={phone} onDelete={handleDelete} showActions={showActions} />
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">E'lonni o'chirmoqchimisiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bu amalni bekor qilib bo'lmaydi. E'lon butunlay o'chirib tashlanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-primary/10">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
