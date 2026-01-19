import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { signIn, signUp } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import phonixLogo from "@/assets/phonix-logo.png";

const authSchema = z.object({
  email: z.string().trim().email("Iltimos, to'g'ri email kiriting").max(255, "Email juda uzun"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak").max(72, "Parol juda uzun"),
  fullName: z.string().trim().max(100, "Ism juda uzun").optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Bu email allaqachon ro'yxatdan o'tgan. Iltimos, tizimga kiring.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Hisob muvaffaqiyatli yaratildi!");
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Noto'g'ri email yoki parol. Qaytadan urinib ko'ring.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Xush kelibsiz!");
      }
      navigate("/");
    } catch {
      toast.error("Kutilmagan xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(166_84%_40%/0.12)_0%,transparent_70%)]" />
      </div>

      <Card className="w-full max-w-md animate-scale-in shadow-card-hover bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src={phonixLogo} 
              alt="Phonix Logo" 
              className="h-16 w-16 rounded-xl shadow-glow mx-auto"
            />
          </div>
          <CardTitle className="font-display text-2xl text-foreground">
            {isSignUp ? "Hisob yarating" : "Xush kelibsiz"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp
              ? "Bugun telefonlarni sotish va sotib olishni boshlang"
              : "Phonix hisobingizga kiring"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSignUp && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">To'liq ism</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ismingizni kiriting" 
                          {...field} 
                          className="bg-secondary border-border focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@misol.com" 
                        {...field} 
                        className="bg-secondary border-border focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Parol</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="bg-secondary border-border focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full shadow-button bg-primary hover:bg-primary/90" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Hisob yaratish" : "Kirish"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                form.reset();
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {isSignUp
                ? "Hisobingiz bormi? Kirish"
                : "Hisobingiz yo'qmi? Ro'yxatdan o'ting"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
