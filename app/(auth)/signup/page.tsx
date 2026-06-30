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

import { signupClientAction, type AuthState } from "../actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signupClientAction,
    null,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>광고주 회원가입</CardTitle>
        <CardDescription>
          이메일이 로그인 아이디가 됩니다. 가입 직후 비밀번호 설정 화면으로
          안내되며, 본인이 직접 비밀번호를 정합니다. 파트너 대행사 계정은
          운영자가 별도로 발급합니다.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">담당자명</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">회사명(상호)</Label>
            <Input id="company" name="company" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일 (로그인 아이디)</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz_reg_no">사업자등록번호</Label>
            <Input
              id="biz_reg_no"
              name="biz_reg_no"
              inputMode="numeric"
              placeholder="숫자 10자리 (예: 1234567890)"
              required
            />
            <p className="text-xs text-muted-foreground">
              본인 확인 및 세금계산서 발행에 사용됩니다.
            </p>
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "가입 처리 중..." : "가입하기"}
          </Button>
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary underline">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
