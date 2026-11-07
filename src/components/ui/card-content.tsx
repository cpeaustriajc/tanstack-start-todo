import type { ReactNode } from "react";

type CardContentProps = Readonly<{ children: ReactNode }>;

export const CardContent = ({ children }: CardContentProps) => (
  <div className="flex flex-col gap-4 px-(--card-spacing)" data-slot="card-content">
    {children}
  </div>
);
