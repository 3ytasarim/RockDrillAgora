import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  productCount: number;
  imageUrl: string;
  onClick: () => void;
}

export default function CategoryCard({ 
  title, 
  description, 
  icon: Icon, 
  productCount, 
  imageUrl, 
  onClick 
}: CategoryCardProps) {
  return (
    <div 
      className="bg-card rounded-lg shadow-lg overflow-hidden border border-border hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onClick}
      data-testid={`category-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-48 object-cover"
        loading="lazy"
      />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center">
            <Icon size={24} />
          </div>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center justify-end">
          <span className="text-primary font-semibold">
            View Products <i className="fas fa-arrow-right ml-1"></i>
          </span>
        </div>
      </div>
    </div>
  );
}
