"use client";

import { useState } from "react";
import { BracesIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { UpstreamVariable } from "@/features/editor/lib/get-upstream-variables";

interface VariablePickerProps {
  variables: UpstreamVariable[];
  onSelect: (value: string) => void;
}

export const VariablePicker = ({ variables, onSelect }: VariablePickerProps) => {
  const [open, setOpen] = useState(false);

  if (variables.length === 0) return null;

  const grouped = variables.reduce<Record<string, UpstreamVariable[]>>((acc, v) => {
    if (!acc[v.nodeName]) acc[v.nodeName] = [];
    acc[v.nodeName].push(v);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground gap-1 font-normal"
        >
          <BracesIcon className="h-3 w-3" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <p className="text-xs text-muted-foreground px-2 pb-2">
          Click to insert at cursor
        </p>
        <div className="space-y-1">
          {Object.entries(grouped).map(([nodeName, vars]) => (
            <div key={nodeName}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                {nodeName}
              </p>
              {vars.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs font-mono rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    onSelect(v.value);
                    setOpen(false);
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
