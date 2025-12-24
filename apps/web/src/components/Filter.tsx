"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  ComponentProps,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/utils/shadcn";

interface FilterProviderInterface {
  filterValue: string;
  setFilterValue: (filter: string) => void;
}

const FilterContext = createContext<FilterProviderInterface | undefined>(undefined);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}

export default function FilterProvider({
  children,
  defaultFilterValue = "all",
}: {
  defaultFilterValue?: string;
  children: ReactNode;
}) {
  const [filterValue, setFilterValue] = useState<string>(defaultFilterValue);

  return (
    <FilterContext.Provider
      value={{
        filterValue,
        setFilterValue,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function FilterSelect({
  items,
  className,
  ...props
}: { items: { name: string; value: string }[] } & ComponentProps<
  typeof SelectTrigger
>) {
  const { filterValue, setFilterValue } = useFilterContext();

  return (
    <Select onValueChange={(value) => setFilterValue(value)} value={filterValue}>
      <SelectTrigger
        className={cn("h-[36px] rounded-full", className)}
        {...props}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

