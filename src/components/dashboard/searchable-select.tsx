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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "../ui/checkbox";

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Selecione uma opção...",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    onChange(value);
  };
  
  const selectedLabels = selectedValues.map(value => options.find(o => o.value === value)?.label).filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-auto"
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedLabels.length > 0 ? (
                selectedLabels.map((label, index) => (
                    <Badge variant="secondary" key={index} className="mr-1">
                        {label}
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label={`Remover ${label}`}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const valueToRemove = options.find(o => o.label === label)?.value;
                                if (valueToRemove) {
                                    handleSelect(valueToRemove)
                                }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                const valueToRemove = options.find(o => o.label === label)?.value;
                                if (valueToRemove) {
                                    handleSelect(valueToRemove)
                                }
                              }
                            }}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </span>
                    </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                        id={`select-${option.value}`}
                        checked={isSelected}
                        aria-labelledby={`select-label-${option.value}`}
                    />
                    <span id={`select-label-${option.value}`}>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
