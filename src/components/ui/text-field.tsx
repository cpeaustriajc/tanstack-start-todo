import { TextField as TextFieldPrimitive } from "react-aria-components";
import type { TextFieldProps } from "react-aria-components";

import { Input } from "#/components/ui/input.tsx";

type Props = Readonly<
  Pick<TextFieldProps, "aria-label" | "isDisabled" | "name" | "onChange" | "value"> & {
    placeholder: string;
  }
>;

export const TextField = ({ placeholder, ...props }: Props) => (
  <TextFieldPrimitive className="flex w-full flex-col gap-1.5" data-slot="text-field" {...props}>
    <Input placeholder={placeholder} />
  </TextFieldPrimitive>
);
