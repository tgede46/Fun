"use client";

import { Card, CardContent } from "@/components/ui/card";

type ProjectCardProps = {
  name: string;
  path: string;
  onSelect: () => void;
};

export function ProjectCard({ name, path, onSelect }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onSelect}
    >
      <CardContent>
        <span className="block font-semibold text-card-foreground truncate">{name}</span>
        <span className="block text-xs text-muted-foreground truncate mt-1 font-mono">{path}</span>
      </CardContent>
    </Card>
  );
}
