"use client";

import type { ReactNode } from "react";
import { AnimatedCounter } from "./AnimatedCounter";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
  gradient: string; // e.g. "from-blue-500 to-blue-600"
  delay?: number;
}

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-6 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle overlay on hover */}
      <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 space-y-4">
        {/* icon + value */}
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
            {icon}
          </span>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-white">
              {typeof value === "number" ? (
                <AnimatedCounter value={value} />
              ) : (
                value
              )}
            </p>
            <p className="text-sm font-medium text-white/80">{label}</p>
          </div>
        </div>

        {/* subtitle */}
        {subtitle && (
          <p className="text-xs font-medium text-white/70">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
