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
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

const mappingSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$.]*$/, "Must be a valid identifier"),
  expression: z.string().min(1, "Expression is required"),
});

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Must start with a letter or underscore, letters/numbers/underscores only",
    }),
  mappings: z.array(mappingSchema).min(1, "At least one mapping is required"),
});

export type TransformFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransformFormValues) => void;
  defaultValues?: Partial<TransformFormValues>;
}

export const TransformDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  const form = useForm<TransformFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName ?? "transformed",
      mappings: defaultValues.mappings ?? [{ key: "", expression: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mappings",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName ?? "transformed",
        mappings: defaultValues.mappings ?? [{ key: "", expression: "" }],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (values: TransformFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transform Configuration</DialogTitle>
          <DialogDescription>
            Map fields from the workflow context using JSONata expressions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-2">

            {/* Variable Name */}
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="transformed" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access the result in later nodes as{" "}
                    <span className="font-mono">{`{{${field.value || "transformed"}.fieldName}}`}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mappings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Field Mappings</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", expression: "" })}
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Add field
                </Button>
              </div>

              <div className="rounded-md border divide-y">
                {/* Header */}
                <div className="grid grid-cols-[1fr_2fr_auto] gap-2 px-3 py-2 bg-muted/40">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output key</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">JSONata expression</span>
                  <span className="w-6" />
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_2fr_auto] gap-2 px-3 py-2 items-start">
                    <FormField
                      control={form.control}
                      name={`mappings.${index}.key`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              placeholder="name"
                              className="font-mono text-sm h-8"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`mappings.${index}.expression`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              placeholder="$.httpResult.body.name"
                              className="font-mono text-sm h-8"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 mt-0.5 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {form.formState.errors.mappings?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.mappings.root.message}</p>
              )}
            </div>

            {/* JSONata reference */}
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">JSONata expression examples</p>
              <p><span className="font-mono text-foreground">$.httpResult.body.email</span> — nested field access</p>
              <p><span className="font-mono text-foreground">$.name & " " & $.surname</span> — string concatenation</p>
              <p><span className="font-mono text-foreground">$uppercase($.status)</span> — built-in string function</p>
              <p><span className="font-mono text-foreground">$.items[0].price * $.items[0].qty</span> — arithmetic</p>
              <p><span className="font-mono text-foreground">$count($.items)</span> — array length</p>
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
