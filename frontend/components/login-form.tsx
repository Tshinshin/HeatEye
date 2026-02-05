"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

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

  // NEW_PASSWORD_REQUIRED 用
  const [challenge, setChallenge] = useState<"NEW_PASSWORD_REQUIRED" | null>(null);
  const [session, setSession] = useState<string | null>(null);

  const [idToken, setIdToken] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
      newPassword: "",
    },
  });

  // ログイン成功 → cookie セット → 遷移
  useEffect(() => {
    if (!idToken) return;

    document.cookie = `idToken=${encodeURIComponent(
      idToken
    )}; path=/; max-age=3600; samesite=lax`;

    router.replace(nextPath);
    router.refresh();
  }, [idToken, nextPath, router]);

  function getClient(): CognitoIdentityProviderClient | null {
    const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
    if (!region) {
      setError("設定不足: NEXT_PUBLIC_COGNITO_REGION が未設定です");
      return null;
    }
    return new CognitoIdentityProviderClient({ region });
  }

  function getClientId(): string | null {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    if (!clientId) {
      setError("設定不足: NEXT_PUBLIC_COGNITO_CLIENT_ID が未設定です");
      return null;
    }
    return clientId;
  }

  async function onSubmit(values: LoginValues) {
    setError(null);

    const client = getClient();
    const clientId = getClientId();
    if (!client || !clientId) return;

    try {
      // 1) まず通常ログイン
      if (!challenge) {
        const command = new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: clientId,
          AuthParameters: {
            USERNAME: values.email,
            PASSWORD: values.password,
          },
        });

        const result = await client.send(command);

        // NEW_PASSWORD_REQUIRED の場合：token は返らない。session を保持して次の入力へ。
        if (result.ChallengeName === "NEW_PASSWORD_REQUIRED" && result.Session) {
          setChallenge("NEW_PASSWORD_REQUIRED");
          setSession(result.Session);
          setError("初回ログインのため、新しいパスワードの設定が必要です。");
          return;
        }

        const token = result.AuthenticationResult?.IdToken;
        if (!token) {
          setError("ログインに失敗しました（IdToken が取得できません）");
          return;
        }

        setIdToken(token);
        return;
      }

      // 2) NEW_PASSWORD_REQUIRED の応答（新パスワード設定）
      if (challenge === "NEW_PASSWORD_REQUIRED") {
        if (!session) {
          setError("セッション情報がありません。最初からやり直してください。");
          setChallenge(null);
          return;
        }

        if (!values.newPassword) {
          setError("新しいパスワードを入力してください。");
          return;
        }

        const cmd = new RespondToAuthChallengeCommand({
          ClientId: clientId,
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          Session: session,
          ChallengeResponses: {
            USERNAME: values.email,
            NEW_PASSWORD: values.newPassword,
          },
        });

        const result = await client.send(cmd);
        const token = result.AuthenticationResult?.IdToken;

        if (!token) {
          setError("パスワード更新に失敗しました（IdToken が取得できません）");
          return;
        }

        // 成功したら challenge 状態をクリアして遷移へ
        setChallenge(null);
        setSession(null);
        form.setValue("password", "");
        form.setValue("newPassword", "");

        setIdToken(token);
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
                setSession(null);
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
