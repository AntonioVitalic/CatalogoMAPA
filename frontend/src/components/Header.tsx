
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { LogIn, LogOut, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">Administrador</span>;
      case 'editor':
        return <span className="ml-2 px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">Editor</span>;
      case 'visitor':
      default:
        return <span className="ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">Visitante</span>;
    }
  };

  return (
    <header className="w-full border-b">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/f901f07e-3f12-4750-8ba7-ba8457ca5b5e.png" 
              alt="Museo de Arte Popular Americano Tomás Lago" 
              className="h-12"
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User size={18} />
                  <span>{user.name}</span>
                  {role && getRoleBadge(role)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2" onClick={logout}>
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={onLoginClick}>
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
