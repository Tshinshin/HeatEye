"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";

type LoginValues = {
  email: string;
  password: string;
  newPassword: string;
};

function getErrString(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name : "Error";
    const msg = typeof e.message === "string" ? e.message : "ログインに失敗しました";
    return `${name}: ${msg}`;
  }
  return "ログインに失敗しました";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    // 安全のため相対パスだけ許可（オープンリダイレクト対策）
    if (next && next.startsWith("/")) return next;
    return "/";
  }, [searchParams]);

  const [error, setError] = useState<string | null>(null);

  // NEW_PASSWORD_REQUIRED 用（Amplify では nextStep.signInStep で判定）
  const [challenge, setChallenge] = useState<"NEW_PASSWORD_REQUIRED" | null>(null);

  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);

    try {
      // 1) 通常ログイン（まだ challenge が無い場合）
      if (!challenge) {
        const res = await signIn({
          username: values.email,
          password: values.password,
        });

        // 初回ログイン等で「新パスワード必須」になった場合
        if (res.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
          setChallenge("NEW_PASSWORD_REQUIRED");
          setError("初回ログインのため、新しいパスワードの設定が必要です。");
          return;
        }

        // 他のチャレンジ（MFA等）が来た場合は、まずエラーで気づけるようにする
        if (res.nextStep?.signInStep && res.nextStep.signInStep !== "DONE") {
          setError(`追加のサインイン手順が必要です: ${res.nextStep.signInStep}`);
          return;
        }

        // DONE ならセッションを確定させて遷移
        await fetchAuthSession({ forceRefresh: true });
        router.replace(nextPath);
        router.refresh();
        return;
      }

      // 2) NEW_PASSWORD_REQUIRED の応答（新パスワード設定）
      if (challenge === "NEW_PASSWORD_REQUIRED") {
        if (!values.newPassword) {
          setError("新しいパスワードを入力してください。");
          return;
        }

        const res = await confirmSignIn({
          challengeResponse: values.newPassword,
        });

        // もしまだ別のステップが残っていたら表示
        if (res.nextStep?.signInStep && res.nextStep.signInStep !== "DONE") {
          setError(`追加のサインイン手順が必要です: ${res.nextStep.signInStep}`);
          return;
        }

        // 成功したら challenge 状態をクリアして遷移
        setChallenge(null);
        form.setValue("password", "");
        form.setValue("newPassword", "");

        await fetchAuthSession({ forceRefresh: true });
        router.replace(nextPath);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getErrString(err));
    }
  }

  const isNewPassword = challenge === "NEW_PASSWORD_REQUIRED";

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-2xl font-bold text-center">ログイン</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    autoComplete="email"
                    disabled={isNewPassword} // NEW_PASSWORD_REQUIRED 中はユーザー名固定推奨
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isNewPassword && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isNewPassword && (
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新しいパスワード</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="新しいパスワード"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            {isNewPassword ? "新しいパスワードを設定" : "ログイン"}
          </Button>

          {isNewPassword && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setChallenge(null);
                setError(null);
                form.setValue("newPassword", "");
              }}
            >
              戻る
            </Button>
          )}
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        まだアカウントがありませんか？（xxxx@i-rela.comに問い合わせてください）
      </p>
    </div>
  );
}
