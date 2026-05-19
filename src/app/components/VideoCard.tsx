import { Play, Eye } from 'lucide-react';

interface VideoCardProps {
  title: string;
  category: string;
  author: string;
  views: number;
  type: 'internal' | 'youtube';
  thumbnail: string;
  onClick?: () => void;
  onAuthorClick?: () => void;
}

export function VideoCard({
  title,
  category,
  author,
  views,
  type,
  thumbnail,
  onClick,
  onAuthorClick,
}: VideoCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="w-6 h-6 text-primary ml-1" fill="currentColor" />
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${
              type === 'internal'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {type === 'internal' ? 'Interno' : 'YouTube'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-2 mb-2">
          {title}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span
            onClick={(e) => {
              if (onAuthorClick) {
                e.stopPropagation();
                onAuthorClick();
              }
            }}
            className={`truncate ${
              onAuthorClick
                ? 'hover:text-primary hover:underline cursor-pointer transition-colors duration-200'
                : ''
            }`}
          >
            {author}
          </span>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{views}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-block px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">
            {category}
          </span>
        </div>
      </div>
    </div>
  );
}
