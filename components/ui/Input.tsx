"use client";

import type { InputHTMLAttributes } from "react";

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-muted">{label}</span>}
      <input className={`input ${className}`} {...rest} />
    </label>
  );
}
