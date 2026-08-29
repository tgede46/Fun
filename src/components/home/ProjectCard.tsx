"use client";

type ProjectCardProps = {
  name: string;
  path: string;
  onSelect: () => void;
};

export function ProjectCard({ name, path, onSelect }: ProjectCardProps) {
  return (
    <button className="project-card" type="button" onClick={onSelect}>
      <span className="project-card__name">{name}</span>
      <span className="project-card__path">{path}</span>
    </button>
  );
}
