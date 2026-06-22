"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) throw new Error("API URLが設定されていません");

      const res = await fetch(`${base}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setStatus("done");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "送信に失敗しました";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">お問い合わせ</h1>

      {status === "done" ? (
        <div className="rounded-md border border-green-300 bg-green-50 p-6 text-center">
          <p className="text-green-700 font-medium">お問い合わせを受け付けました。</p>
          <p className="mt-1 text-sm text-green-600">担当者よりご連絡いたします。</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setStatus("idle")}
          >
            もう一件送る
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              name="name"
              placeholder="山田 太郎"
              required
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">メールアドレス（返信先）</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="subject">件名</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="お問い合わせの件名"
              required
              value={form.subject}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="message">お問い合わせ内容</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="お問い合わせ内容をご記入ください"
              rows={6}
              required
              value={form.message}
              onChange={handleChange}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}

          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "送信中..." : "送信する"}
          </Button>
        </form>
      )}
    </div>
  );
}
