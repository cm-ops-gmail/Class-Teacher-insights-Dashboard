"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MultiSelectFilterProps = {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  title: string;
  triggerClassName?: string;
};

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectedValuesChange,
  title,
  triggerClassName,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectedValuesChange(newSelectedValues);
  };

  const getTriggerLabel = () => {
    if (selectedValues.length === 0) {
      return title;
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  const allValues = options.map(o => o.value);
  const allSelected = selectedValues.length === allValues.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectedValuesChange([]);
    } else {
      onSelectedValuesChange(allValues);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-10 justify-between", triggerClassName)}
        >
          <span className="truncate">{getTriggerLabel()}</span>
          <div className="flex items-center">
            {selectedValues.length > 0 && (
                <X
                  className="mr-2 h-4 w-4 shrink-0 opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectedValuesChange([]);
                  }}
                />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={handleSelectAll} className="font-semibold">
                {allSelected ? "Deselect All" : "Select All"}
              </CommandItem>
              <CommandSeparator />
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
