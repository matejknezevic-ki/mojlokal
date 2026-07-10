"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function WaiterLogoutButton({
  children,
  label,
  slug,
}: {
  children: ReactNode;
  label: string;
  slug: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/waiter/logout", { method: "POST" });
        router.push(slug ? `/w/${slug}` : "/w");
        router.refresh();
      }}
      className="rounded-xl p-2 text-espresso-light hover:bg-espresso/5"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
