import { Shield, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  isAdmin?: boolean;
  onLogout?: () => void;
  className?: string;
}

export function Header({ isAdmin = false, onLogout, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full glass-strong",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 glow-primary">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight">
              Project Sentinel
            </span>
            <span className="text-xs text-muted-foreground">
              AI-Powered Compliance
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-item-profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-item-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive"
                  data-testid="menu-item-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
