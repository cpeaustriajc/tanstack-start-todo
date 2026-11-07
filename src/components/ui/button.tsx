import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";
import { Button as ButtonPrimitive } from "react-aria-components";

import { buttonVariants } from "#/components/ui/button-variants.ts";

type ButtonProps = Readonly<
  Pick<AriaButtonProps, "aria-label" | "isDisabled" | "onPress" | "type"> &
    VariantProps<typeof buttonVariants> & { children: ReactNode }
>;

export const Button = ({ size, variant, ...props }: ButtonProps) => (
  <ButtonPrimitive
    className={buttonVariants({ size, variant })}
    data-size={size}
    data-slot="button"
    data-variant={variant}
    {...props}
  />
);
