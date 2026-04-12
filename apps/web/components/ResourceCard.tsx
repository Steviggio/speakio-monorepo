import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Resource } from "@repo/types";
import { useTranslation } from "@/lib/i18n";

export function ResourceCard({
  resource,
  isFavorite,
  onToggleFavorite,
}: {
  resource: Resource;
  isFavorite: boolean;
  onToggleFavorite: (id: string, isFav: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => onToggleFavorite(resource._id, isFavorite)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
        >
          <Heart
            className={`w-6 h-6 transition-colors ${
              isFavorite
                ? "fill-rose-500 text-rose-500"
                : "text-slate-300 hover:text-rose-400"
            }`}
          />
        </button>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
            {t(`resources.types.${resource.type.toLowerCase()}`)}
          </span>
          <span className="border border-slate-200 bg-slate-50 text-slate-600 rounded-full px-2 py-0.5 text-xs font-medium uppercase">
            {resource.language}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            {resource.title}
            <span className="absolute inset-0 z-0" aria-hidden="true" />
          </a>
        </h3>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2">
          {resource.description}
        </p>
      </div>
      <div className="mt-4 flex gap-2 flex-wrap relative z-10">
        {resource.tags?.map((tag) => (
          <span key={tag} className="text-xs text-slate-400">
            #{tag}
          </span>
        ))}
      </div>
    </Card>
  );
}
