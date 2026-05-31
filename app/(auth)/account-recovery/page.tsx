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

import {
  findIdAction,
  requestPasswordResetAction,
  type FindIdState,
  type ResetPwState,
} from "./actions";

export default function AccountRecoveryPage() {
  const [idState, findId, idPending] = useActionState<FindIdState, FormData>(
    findIdAction,
    null,
  );
  const [pwState, resetPw, pwPending] = useActionState<ResetPwState, FormData>(
    requestPasswordResetAction,
    null,
  );

  return (
    <div className="w-full max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>아이디 찾기</CardTitle>
          <CardDescription>
            가입 시 등록한 사업자등록번호로 아이디(이메일)를 확인합니다.
          </CardDescription>
        </CardHeader>
        <form action={findId}>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="biz_reg_no">사업자등록번호</Label>
              <Input
                id="biz_reg_no"
                name="biz_reg_no"
                inputMode="numeric"
                placeholder="숫자 10자리"
                required
              />
            </div>
            {idState?.ok ? (
              <p className="text-sm text-emerald-600">
                가입된 아이디: <strong>{idState.email}</strong>
              </p>
            ) : idState && !idState.ok ? (
              <p className="text-sm text-destructive">{idState.error}</p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={idPending}
            >
              {idPending ? "조회 중..." : "아이디 찾기"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>
            가입한 이메일로 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <form action={resetPw}>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {pwState?.ok ? (
              <p className="text-sm text-emerald-600">{pwState.message}</p>
            ) : pwState && !pwState.ok ? (
              <p className="text-sm text-destructive">{pwState.error}</p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pwPending}>
              {pwPending ? "발송 중..." : "재설정 링크 받기"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
