"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Users, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

const navItems = [
  { href: "/dashboard", label: "Call Log", icon: Phone },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminItems = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { profile } = useUser();

  const items = [
    ...navItems,
    ...(profile?.role === "admin" ? adminItems : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Phone className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold">
          Call<span className="text-indigo-500">Desk</span>
        </span>
      </div>

      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
