import { z } from "zod";

export const rfpApplicationSchema = z.object({
  approach: z.string().min(1, "제안 개요를 작성해주세요.").max(2000),
  team_composition: z.string().max(1000).optional().or(z.literal("").transform(() => undefined)),
  similar_cases: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  differentiation: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  quote_monthly: z.coerce
    .number({ message: "월 견적을 숫자로 입력해주세요." })
    .int()
    .min(0, "0 이상 숫자를 입력해주세요."),
  start_available: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type RfpApplicationInput = z.input<typeof rfpApplicationSchema>;
export type RfpApplicationOutput = z.output<typeof rfpApplicationSchema>;

export type ProposalMeta = {
  approach: string;
  team_composition: string | null;
  similar_cases: string | null;
  differentiation: string | null;
};

export const APPLICATION_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  submitted: { label: "제출 완료", variant: "warning" },
  shortlisted: { label: "후보 선정", variant: "success" },
  rejected: { label: "미선정", variant: "muted" },
  withdrawn: { label: "지원 취소", variant: "destructive" },
};
