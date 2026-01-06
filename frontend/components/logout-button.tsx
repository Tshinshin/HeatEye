// components/logout-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => {
        document.cookie = "idToken=; path=/; max-age=0";
        router.replace("/login");
      }}
    >
      ログアウト
    </Button>
  );
}
