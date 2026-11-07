import type { ReactNode } from "react";

type CardHeaderProps = Readonly<{ children: ReactNode }>;

export const CardHeader = ({ children }: CardHeaderProps) => (
  <div
    className="group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing)"
    data-slot="card-header"
  >
    {children}
  </div>
);
