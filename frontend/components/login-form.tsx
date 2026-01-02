"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"

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

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: { email: string; password: string }) {
    setError(null)

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    })

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: values.email,
          PASSWORD: values.password,
        },
      })

      const result = await client.send(command)
      const idToken = result.AuthenticationResult?.IdToken

      if (!idToken) {
        setError("ログインに失敗しました")
        return
      }

      document.cookie = `idToken=${idToken}; path=/; max-age=3600`
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      setError("メールまたはパスワードが違います")
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
