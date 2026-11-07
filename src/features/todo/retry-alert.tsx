import type { ReactNode } from "react";

import { Button } from "#/components/ui/button.tsx";

type Props = Readonly<{ children: ReactNode; onRetry: () => void }>;

export const RetryAlert = ({ children, onRetry }: Props) => (
  <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
    {children}
    <Button onPress={onRetry} size="sm" variant="outline">
      Retry
    </Button>
  </p>
);
