import { cn } from "@/lib/utils";

// Extracted placeholder from your MusicCard component
const SCVaultPlaceholder: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}> = ({ 
  className, 
  size = 'md',
  text = 'IMG'
}) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20", 
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  };

  return (
    <div className={cn(
      "w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg",
      className
    )}>
      <div className={cn(
        "bg-muted-foreground/10 rounded-lg flex items-center justify-center",
        sizeClasses[size]
      )}>
        <span className="text-muted-foreground text-xs font-medium">
          {text}
        </span>
      </div>
    </div>
  );
};

export default SCVaultPlaceholder