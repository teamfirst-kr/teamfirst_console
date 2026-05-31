import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const rfpApplicationSchema = z.object({
  approach: z
    .string()
    .min(1, "이 광고주에 대한 제안 개요를 작성해주세요.")
    .max(3000),
  past_clients: z
    .string()
    .min(1, "광고대행을 진행한 광고주명을 한 개 이상 적어주세요.")
    .max(3000),
  strengths_weaknesses: optionalText(3000),
  differentiation: optionalText(2000),
  team_composition: optionalText(1000),
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

export type ProposalAttachment = {
  name: string;
  url: string;
  size: number;
};

export type ProposalMeta = {
  approach: string;
  past_clients: string;
  strengths_weaknesses: string | null;
  differentiation: string | null;
  team_composition: string | null;
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
