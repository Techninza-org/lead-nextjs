import * as React from 'react';
import { Check, ChevronRight, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Option {
  label: string;
  value: string;
}

interface NestedComboboxProps {
  data: {
    id: string;
    name: string;
    dependentOnId: string;
    fields: Array<{
      name: string;
      fieldType: string;
      options?: {
        id: string;
        value: Option[];
        label: string;
      };
    }>;
  }[];
  className?: string;
  onSelect: (value: string) => void;
}

export function NestedCombobox({ data, onSelect, className }: NestedComboboxProps) {
  
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [view, setView] = React.useState<'parents' | 'children'>('parents');
  const [selectedParent, setSelectedParent] = React.useState<string | null>(null);
  const [selectedField, setSelectedField] = React.useState<string | null>(null);
  const [valueLabel, setValueLabel] = React.useState('');

  const getSelectFields = (parentName: string) => {
    const parent = data.find((item) => item.name === parentName);
    return parent?.fields.filter((field) => field.fieldType === 'SELECT') || [];
  };

  const getChildOptions = (parentName: string, fieldName: string) => {
    const parent = data.find((item) => item.name === parentName);
    const selectField = parent?.fields.find(
      (field) => field.fieldType === 'SELECT' && field.name === fieldName
    );
    return selectField?.options?.value || [];
  };

  const filteredParents = React.useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const filteredFields = React.useMemo(() => {
    if (!selectedParent) return [];
    const fields = getSelectFields(selectedParent);
    return fields.filter((field) =>
      field.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [selectedParent, search]);

  const handleSelect = (currentValue: string, type: 'parent' | 'field', label: string) => {
    if (type === 'parent') {
      setValueLabel(label);
      setSelectedParent(currentValue);
      setView('children');
      setSearch('');
    } else {
      setValueLabel(label);
      setSelectedField(currentValue);
      setValue(currentValue);
      onSelect(currentValue);
      setOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-[300px] justify-between", className)}
          >
            {`${selectedParent} --> ${valueLabel}` || selectedParent || "Select..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              {view === 'children' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-sm"
                  onClick={() => {
                    setView('parents');
                    setSelectedParent(null);
                    setSelectedField(null);
                    setValue('');
                    setSearch('');
                  }}
                >
                  ← Back
                </Button>
              )}
              <CommandInput
                placeholder={view === 'parents' ? "Search parents..." : "Search fields..."}
                value={search}
                onValueChange={setSearch}
                className="flex-1"
              />
            </div>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {view === 'parents' ? (
                  filteredParents.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={(currentValue) => handleSelect(currentValue, 'parent', item.name)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedParent === item.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {item.name}
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </CommandItem>
                  ))
                ) : (
                  filteredFields.map((field) => (
                    <CommandItem
                      key={field.name}
                      value={field.options?.id}
                      onSelect={(currentValue) => handleSelect(currentValue, 'field', field.name)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedField === field.options?.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {field.name}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-sm">
                            {field.options?.value?.map(opt => `${opt.value}`).join('\n')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}