import type { ReactNode } from "react";

type CardTitleProps = Readonly<{ children: ReactNode }>;

export const CardTitle = ({ children }: CardTitleProps) => (
  <h2 className="font-heading text-base leading-snug font-medium" data-slot="card-title">
    {children}
  </h2>
);
