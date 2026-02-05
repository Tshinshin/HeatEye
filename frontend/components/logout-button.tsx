"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          await signOut();
        } finally {
          router.replace("/login");
          router.refresh();
        }
      }}
    >
      ログアウト
    </Button>
  );
}
