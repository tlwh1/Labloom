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
  previewUrl: z.string().url().optional()
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
