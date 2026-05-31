"use client";

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

import { changePasswordAction, type ChangePwState } from "./actions";

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState<ChangePwState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
        <CardDescription>
          보안을 위해 초기 비밀번호를 새 비밀번호로 변경해주세요.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호 (8자 이상)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">새 비밀번호 확인</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "변경 중..." : "비밀번호 변경하고 시작하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
