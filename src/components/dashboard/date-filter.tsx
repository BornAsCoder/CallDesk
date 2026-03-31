"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, subDays, isToday } from "date-fns";

interface DateFilterProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateFilter({ date, onDateChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDateChange(subDays(date, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 gap-2 text-sm">
            <CalendarIcon className="h-4 w-4" />
            {isToday(date) ? "Today" : format(date, "dd MMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDateChange(addDays(date, 1))}
        disabled={isToday(date)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday(date) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onDateChange(new Date())}
        >
          Today
        </Button>
      )}
    </div>
  );
}
