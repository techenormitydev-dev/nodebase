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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Fixed-frequency builder helpers
// ---------------------------------------------------------------------------

type FreqUnit = "minutes" | "hours" | "days" | "weeks";

const UNIT_OPTIONS: { label: string; value: FreqUnit }[] = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours",   value: "hours" },
  { label: "Days",    value: "days" },
  { label: "Weeks",   value: "weeks" },
];

const WEEKDAYS = [
  { label: "Monday",    value: "1" },
  { label: "Tuesday",   value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday",  value: "4" },
  { label: "Friday",    value: "5" },
  { label: "Saturday",  value: "6" },
  { label: "Sunday",    value: "0" },
];

/** Convert frequency builder state → 5-part cron expression */
function buildCronFromFrequency(
  every: number,
  unit: FreqUnit,
  atMinute: number,
  atHour: number,
  atWeekday: string,
): string {
  switch (unit) {
    case "minutes":
      return every === 1 ? "* * * * *" : `*/${every} * * * *`;
    case "hours":
      return every === 1 ? `${atMinute} * * * *` : `${atMinute} */${every} * * *`;
    case "days":
      return every === 1
        ? `${atMinute} ${atHour} * * *`
        : `${atMinute} ${atHour} */${every} * *`;
    case "weeks":
      return `${atMinute} ${atHour} * * ${atWeekday}`;
  }
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const cronRegex =
  /^(\*|([0-9]|[1-5][0-9])|\*\/[0-9]+)\s+(\*|([0-9]|1[0-9]|2[0-3])|\*\/[0-9]+)\s+(\*|([1-9]|[12][0-9]|3[01])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-2])|\*\/[0-9]+)\s+(\*|[0-6]|\*\/[0-9]+)$/;

const formSchema = z.object({
  cronExpression: z
    .string()
    .min(1, "Cron expression is required")
    .regex(cronRegex, "Must be a valid 5-part cron expression (e.g. */5 * * * *)"),
  timezone: z.string().min(1),
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Must start with a letter or underscore, letters/numbers/underscores only",
    }),
});

export type CronTriggerFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CronTriggerFormValues) => void;
  defaultValues?: Partial<CronTriggerFormValues>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CronTriggerDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  // Which tab is active
  const [mode, setMode] = useState<"frequency" | "cron">("frequency");

  // Frequency builder local state
  const [every, setEvery] = useState(5);
  const [unit, setUnit] = useState<FreqUnit>("minutes");
  const [atMinute, setAtMinute] = useState(0);
  const [atHour, setAtHour] = useState(9);
  const [atWeekday, setAtWeekday] = useState("1");

  const form = useForm<CronTriggerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cronExpression: defaultValues.cronExpression ?? "*/5 * * * *",
      timezone: defaultValues.timezone ?? "UTC",
      variableName: defaultValues.variableName ?? "cronTrigger",
    },
  });

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        cronExpression: defaultValues.cronExpression ?? "*/5 * * * *",
        timezone: defaultValues.timezone ?? "UTC",
        variableName: defaultValues.variableName ?? "cronTrigger",
      });
      setMode("frequency");
      setEvery(5);
      setUnit("minutes");
      setAtMinute(0);
      setAtHour(9);
      setAtWeekday("1");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep form.cronExpression in sync when frequency builder changes
  useEffect(() => {
    if (mode === "frequency") {
      const expr = buildCronFromFrequency(every, unit, atMinute, atHour, atWeekday);
      form.setValue("cronExpression", expr, { shouldValidate: true });
    }
  }, [mode, every, unit, atMinute, atHour, atWeekday, form]);

  const watchedCron = useWatch({ control: form.control, name: "cronExpression" });
  const watchedVar  = useWatch({ control: form.control, name: "variableName" });

  const handleSubmit = (values: CronTriggerFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cron Trigger Configuration</DialogTitle>
          <DialogDescription>
            Schedule this workflow to run automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-2">

            {/* ── Mode tabs ────────────────────────────────────── */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "frequency" | "cron")}>
              <TabsList className="w-full">
                <TabsTrigger value="frequency" className="flex-1">Fixed Frequency</TabsTrigger>
                <TabsTrigger value="cron"      className="flex-1">Cron Expression</TabsTrigger>
              </TabsList>

              {/* ── Fixed-frequency builder ───────────────────── */}
              <TabsContent value="frequency" className="space-y-4 pt-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium shrink-0">Every</span>

                  {/* Number input — hide for "weeks" since it's always 1 week */}
                  {unit !== "weeks" && (
                    <Input
                      type="number"
                      min={1}
                      max={unit === "minutes" ? 59 : unit === "hours" ? 23 : 30}
                      value={every}
                      onChange={(e) => setEvery(Math.max(1, Number(e.target.value)))}
                      className="w-20"
                    />
                  )}

                  <Select value={unit} onValueChange={(v) => { setUnit(v as FreqUnit); setEvery(1); }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekday picker (only for weeks) */}
                {unit === "weeks" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium shrink-0">On</span>
                    <Select value={atWeekday} onValueChange={setAtWeekday}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Time-of-day picker (only for days / weeks) */}
                {(unit === "days" || unit === "weeks") && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium shrink-0">At</span>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={atHour}
                      onChange={(e) => setAtHour(Number(e.target.value))}
                      className="w-20"
                      placeholder="HH"
                    />
                    <span className="text-sm text-muted-foreground">h</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={atMinute}
                      onChange={(e) => setAtMinute(Number(e.target.value))}
                      className="w-20"
                      placeholder="MM"
                    />
                    <span className="text-sm text-muted-foreground">m</span>
                  </div>
                )}

                {/* Minute offset for hourly */}
                {unit === "hours" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium shrink-0">At minute</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={atMinute}
                      onChange={(e) => setAtMinute(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Cron: <span className="font-mono">{watchedCron}</span>
                </p>
              </TabsContent>

              {/* ── Raw cron expression ───────────────────────── */}
              <TabsContent value="cron" className="pt-3">
                <FormField
                  control={form.control}
                  name="cronExpression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cron Expression</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="*/5 * * * *"
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Format:{" "}
                        <span className="font-mono text-foreground">
                          minute&nbsp; hour&nbsp; day&nbsp; month&nbsp; weekday
                        </span>
                      </FormDescription>
                      <FormDescription>
                        Examples: &nbsp;
                        <span className="font-mono">*/15 * * * *</span> every 15 min &nbsp;|&nbsp;
                        <span className="font-mono">0 9 * * 1</span> Mon 9am
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* ── Timezone ─────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Variable name ─────────────────────────────────── */}
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="cronTrigger" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access in later nodes:{" "}
                    <span className="font-mono">{`{{${watchedVar || "cronTrigger"}.triggeredAt}}`}</span>
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
