"use client";

import { Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CallLogStatsProps {
  total: number;
  sorted: number;
  unsorted: number;
  isLoading: boolean;
}

export function CallLogStats({ total, sorted, unsorted, isLoading }: CallLogStatsProps) {
  const stats = [
    {
      label: "Total Calls",
      value: total,
      icon: Phone,
      color: "text-blue-500",
    },
    {
      label: "Sorted",
      value: sorted,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Unsorted",
      value: unsorted,
      icon: AlertCircle,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
