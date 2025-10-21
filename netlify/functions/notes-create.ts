import type { Handler } from "@netlify/functions";
import { getSqlClient } from "./_shared/db";
import { badRequest, handleError, json, methodNotAllowed, noContent } from "./_shared/http";
import { notePayloadSchema } from "./_shared/validation";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return methodNotAllowed(["POST", "OPTIONS"]);
  }

  try {
    if (!event.body) {
      return badRequest("요청 본문이 비어 있습니다.");
    }

    const parsed = notePayloadSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().formErrors.join(", "));
    }

    const payload = parsed.data;
    const sql = getSqlClient();

    const result = await sql(
      `
        INSERT INTO notes (title, content, category, tags, attachments)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING id,
                  title,
                  content,
                  category,
                  tags,
                  attachments,
                  created_at AS "createdAt",
                  updated_at AS "updatedAt"
      `,
      [payload.title, payload.content, payload.category, JSON.stringify(payload.tags), JSON.stringify(payload.attachments)]
    );

    return json(201, result[0]);
  } catch (error) {
    return handleError(error);
  }
};

export { handler };
