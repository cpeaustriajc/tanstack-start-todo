import type { ReactNode } from "react";
import { Form as FormPrimitive } from "react-aria-components";
import type { FormProps as FormPrimitiveProps } from "react-aria-components";

type FormProps = Readonly<Pick<FormPrimitiveProps, "onSubmit"> & { children: ReactNode }>;

export const Form = (props: FormProps) => (
  <FormPrimitive className="flex flex-col gap-2" data-slot="form" {...props} />
);
