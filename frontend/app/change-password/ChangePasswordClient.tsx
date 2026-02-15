"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, updatePassword, signOut } from "aws-amplify/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function errMsg(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name : "Error";
    const msg =
      typeof e.message === "string" ? e.message : "パスワード変更に失敗しました";
    return `${name}: ${msg}`;
  }
  return "パスワード変更に失敗しました";
}

export default function ChangePasswordClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialEmail = useMemo(() => sp.get("email") ?? "", [sp]);

  const [email, setEmail] = useState(initialEmail);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onSubmit = async () => {
    setError("");
    setMessage("");

    if (!email) return setError("ユーザーID（メールアドレス）を入力してください。");
    if (!oldPassword) return setError("古いパスワードを入力してください。");
    if (!newPassword) return setError("新しいパスワードを入力してください。");
    if (newPassword !== newPassword2)
      return setError("新しいパスワードが一致しません。");

    setLoading(true);
    try {
      // 1) 古いPWでサインインしてセッション作成
      const res = await signIn({ username: email, password: oldPassword });

      const step = res?.nextStep?.signInStep;
      if (typeof step === "string" && step !== "DONE") {
        throw new Error(`追加のサインイン手順が必要です: ${step}`);
      }

      // 2) 旧→新の変更
      await updatePassword({ oldPassword, newPassword });

      setMessage("パスワードを変更しました。ログイン画面に戻ります。");

      // 変更後はサインアウト（セッションを残さない）
      try {
        await signOut();
      } catch {
        // ignore
      }

      router.replace("/login");
    } catch (e: unknown) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold text-center">パスワードの変更</h1>

      {message && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm">ユーザーID（メールアドレス）</label>
          <Input
            type="email"
            placeholder="user@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">古いパスワード</label>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">新しいパスワード</label>
          <Input
            type="password"
            placeholder="新しいパスワード"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">新しいパスワード（再入力）</label>
          <Input
            type="password"
            placeholder="もう一度入力"
            autoComplete="new-password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={onSubmit} disabled={loading}>
          {loading ? "変更中..." : "変更する"}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
          disabled={loading}
        >
          ログインに戻る
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          パスワードを忘れた場合は管理者に連絡してください。
        </p>
      </div>
    </div>
  );
}
