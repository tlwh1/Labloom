import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().min(1, "태그 ID가 필요합니다."),
  label: z.string().min(1, "태그 이름이 필요합니다.")
});

export const attachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  type: z.string().min(1),
  previewUrl: z
    .string()
    .min(1)
    .refine((value) => {
      if (value.startsWith("data:")) {
        return true;
      }
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "미리보기 URL은 http(s) 또는 data URL이어야 합니다.")
    .optional(),
  dataUrl: z
    .string()
    .refine((value) => value.startsWith("data:"), "dataUrl은 data: 스킴을 포함해야 합니다.")
    .optional()
});

export const notePayloadSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().default(""),
  category: z.string().default(""),
  tags: z.array(tagSchema).default([]),
  attachments: z.array(attachmentSchema).default([])
});

export const noteUpdateSchema = notePayloadSchema.extend({
  id: z.string().uuid("올바른 메모 ID가 필요합니다.")
});

export type NotePayload = z.infer<typeof notePayloadSchema>;
export type NoteUpdatePayload = z.infer<typeof noteUpdateSchema>;
