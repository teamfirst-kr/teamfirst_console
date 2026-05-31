"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction, type AuthState } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호로 로그인하세요. 카카오 로그인은 곧 지원됩니다.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="remember"
              className="flex items-center gap-2 text-sm text-muted-foreground select-none"
            >
              <input
                id="remember"
                name="remember"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input accent-primary"
              />
              로그인 유지
            </label>
            <Link
              href="/account-recovery"
              className="text-sm text-primary hover:underline"
            >
              아이디 찾기 / 비밀번호 찾기
            </Link>
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            아이디는 이메일 주소입니다. 광고주 계정은{" "}
            <Link href="/signup" className="text-primary underline">
              회원가입
            </Link>
            , 대행사 계정은 입점 완료 시 자동 발급됩니다.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
