// components/logout-button.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        document.cookie = "idToken=; path=/; max-age=0";
        window.location.href = "/login";
      }}
    >
      ログアウト
    </Button>
  );
}
