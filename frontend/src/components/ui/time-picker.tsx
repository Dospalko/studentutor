"use client";

/**
 * Jednoduchý time-picker kompatibilný so shadcn štýlom.
 * Prijíma hodnotu Date alebo undefined a volá onChange s Date.
 */
import { ChangeEvent } from "react";

interface TimePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
  /* Format HH:MM pre input */
  const format = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return onChange(null);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(h);
    newDate.setMinutes(m);
    onChange(newDate);
  };

  return (
    <input
      type="time"
      value={value ? format(value) : ""}
      onChange={handle}
      className={`border rounded-md p-2 w-full text-sm bg-background ${className}`}
    />
  );
}
