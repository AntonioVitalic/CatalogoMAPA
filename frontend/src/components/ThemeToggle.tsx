
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Switch 
              id="theme-toggle" 
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
            <Label htmlFor="theme-toggle" className="cursor-pointer flex items-center">
              {theme === "dark" ? (
                <Moon size={16} className="text-primary" />
              ) : (
                <Sun size={16} className="text-primary" />
              )}
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
