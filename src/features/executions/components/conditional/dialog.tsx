"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VariablePicker } from "@/components/variable-picker";
import type { UpstreamVariable } from "@/features/editor/lib/get-upstream-variables";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  condition: z.string().min(1, "Condition expression is required"),
});

export type ConditionalFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ConditionalFormValues) => void;
  defaultValues?: Partial<ConditionalFormValues>;
  upstreamVariables?: UpstreamVariable[];
}

export const ConditionalDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
  upstreamVariables = [],
}: Props) => {
  const form = useForm<ConditionalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      condition: defaultValues.condition || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        condition: defaultValues.condition || "",
      });
    }
  }, [open, defaultValues, form]);

  const conditionRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (variable: string) => {
    const el = conditionRef.current;
    const currentValue = form.getValues("condition") || "";
    if (el) {
      const start = el.selectionStart ?? currentValue.length;
      const end = el.selectionEnd ?? start;
      const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
      form.setValue("condition", newValue, { shouldValidate: true });
      requestAnimationFrame(() => {
        el.setSelectionRange(start + variable.length, start + variable.length);
        el.focus();
      });
    } else {
      form.setValue("condition", currentValue + variable, { shouldValidate: true });
    }
  };

  const watchVariableName = form.watch("variableName") || "myCondition";

  const handleSubmit = (values: ConditionalFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conditional Configuration</DialogTitle>
          <DialogDescription>
            Define the condition that determines which branch to follow.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myCondition" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.branch}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Condition Expression</FormLabel>
                    <VariablePicker
                      variables={upstreamVariables}
                      onSelect={insertAtCursor}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={`{{eq myHttp.status "200"}}`}
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        conditionRef.current = el;
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    A Handlebars expression that evaluates to true or false.
                  </FormDescription>
                  <FormDescription>
                    Helpers: {`{{eq a b}}`} {`{{ne a b}}`} {`{{gt a b}}`} {`{{lt a b}}`} {`{{gte a b}}`} {`{{lte a b}}`} {`{{not a}}`}
                  </FormDescription>
                  <FormDescription>
                    Examples: {`{{eq myHttp.status "200"}}`} or {`{{myGemini.text}}`} (truthy if non-empty)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
