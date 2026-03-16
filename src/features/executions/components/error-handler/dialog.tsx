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
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Must start with a letter or underscore, letters/numbers/underscores only",
    }),
  webhookUrl: z.string().min(1, "Webhook URL is required"),
  message: z.string().min(1, "Message template is required"),
});

export type ErrorHandlerFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ErrorHandlerFormValues) => void;
  defaultValues?: Partial<ErrorHandlerFormValues>;
}

export const ErrorHandlerDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<ErrorHandlerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "errorResult",
      webhookUrl: defaultValues.webhookUrl || "",
      message: defaultValues.message || "⚠️ Workflow error in node {{error.nodeName}}: {{error.message}}",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "errorResult",
        webhookUrl: defaultValues.webhookUrl || "",
        message: defaultValues.message || "⚠️ Workflow error in node {{error.nodeName}}: {{error.message}}",
      });
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (values: ErrorHandlerFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Handler Configuration</DialogTitle>
          <DialogDescription>
            This node is triggered when any node in the workflow fails. Configure where to send the error notification.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="errorResult" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name to store the result in workflow context
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slack Webhook URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://hooks.slack.com/services/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Slack Incoming Webhook URL to receive error notifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Error Message Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="⚠️ Workflow error in node {{error.nodeName}}: {{error.message}}"
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Available variables: {`{{error.message}}`} {`{{error.nodeName}}`} {`{{error.nodeId}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
