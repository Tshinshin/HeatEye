import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-4">
        Hello shadcn + Next.js + Tailwind v4
      </h1>

      <Link href="/dashboard">
        <Button>Click me</Button>
      </Link>
    </main>
  );
}
