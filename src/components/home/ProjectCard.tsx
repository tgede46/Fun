"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProjectCardProps = {
  name: string;
  path: string;
  onSelect: () => void;
  onDelete?: () => void;
};

export function ProjectCard({ name, path, onSelect, onDelete }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={onSelect}
    >
      <CardContent className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className="block font-semibold text-card-foreground truncate">{name}</span>
          <span className="block text-xs text-muted-foreground truncate mt-1 font-mono">{path}</span>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Retirer de la liste"
          >
            ✕
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
