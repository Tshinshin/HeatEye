"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { useForm } from "react-hook-form"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // 👇 副作用（cookie書き込み・画面遷移）は effect に寄せる
  useEffect(() => {
    if (!idToken) return

    document.cookie = `idToken=${encodeURIComponent(
      idToken
    )}; path=/; max-age=3600; samesite=lax`

    router.push("/dashboard")
  }, [idToken, router])

async function onSubmit(values: { email: string; password: string }) {
  setError(null);

  const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!region || !clientId) {
    setError("設定不足: Cognito の環境変数が未設定です（NEXT_PUBLIC_COGNITO_REGION / NEXT_PUBLIC_COGNITO_CLIENT_ID）");
    return;
  }

  const client = new CognitoIdentityProviderClient({ region });

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: values.email,
        PASSWORD: values.password,
      },
    });

    const result = await client.send(command);
    const token = result.AuthenticationResult?.IdToken;

    if (!token) {
      setError("ログインに失敗しました（IdToken が取得できません）");
      return;
    }

    setIdToken(token);
  } catch (err: any) {
    console.error(err);
    // 例外の中身を表示（原因特定用）
    setError(`${err?.name ?? "Error"}: ${err?.message ?? "ログインに失敗しました"}`);
  }
}

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
                  <Input type="email" placeholder="user@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>パスワード</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        まだアカウントがありませんか？（サインアップ画面も作れます）
      </p>
    </div>
  )
}
