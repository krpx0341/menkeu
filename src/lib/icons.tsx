import * as Icons from "lucide-react";
import { Circle, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

// Category icons are stored as kebab-case strings (e.g. "shopping-bag").
// lucide-react exports PascalCase component names, so convert and fall back
// to a generic circle when a name doesn't match a known icon.
export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const Icon = (Icons as unknown as Record<string, ComponentType<LucideProps>>)[pascal] ?? Circle;
  return <Icon {...props} />;
}
