import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessages";
import { signOut } from "@/lib/auth";
import { Plus, LogOut, User, Shield, MessageCircle, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import phonixLogo from "@/assets/phonix-logo.png";

export function Header() {
  const { user, isAdmin, loading } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={phonixLogo} 
            alt="Phonix Logo" 
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-lg font-bold text-foreground">Phonix</span>
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <>
              {/* Notifications */}
              <NotificationDropdown />

              {/* Messages */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className="relative h-10 w-10 rounded-full"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Create listing */}
              <Button
                size="sm"
                onClick={() => navigate("/phones/new")}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Sotish</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm truncate">{user.email}</p>
                      {isAdmin && (
                        <Badge variant="secondary" className="w-fit text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={() => navigate("/my-listings")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Mening e'lonlarim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/requests")} className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    So'rovlarim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Xabarlar
                    {unreadCount && unreadCount > 0 && (
                      <Badge variant="default" className="ml-auto text-xs bg-primary">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Kirish
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Ro'yxatdan o'tish
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
