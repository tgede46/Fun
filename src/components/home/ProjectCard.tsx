"use client";

type ProjectCardProps = {
  name: string;
  path: string;
  onSelect: () => void;
};

export function ProjectCard({ name, path, onSelect }: ProjectCardProps) {
  return (
    <button
      className="w-full text-left rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
      type="button"
      onClick={onSelect}
    >
      <span className="block font-semibold text-card-foreground truncate">{name}</span>
      <span className="block text-xs text-muted-foreground truncate mt-1 font-mono">{path}</span>
    </button>
  );
}
