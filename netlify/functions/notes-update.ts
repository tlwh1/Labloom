import type { Handler } from "@netlify/functions";
import { getSqlClient } from "./_shared/db";
import { badRequest, handleError, json, methodNotAllowed, noContent, notFound } from "./_shared/http";
import { noteUpdateSchema } from "./_shared/validation";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (!["PUT", "PATCH"].includes(event.httpMethod ?? "")) {
    return methodNotAllowed(["PUT", "PATCH", "OPTIONS"]);
  }

  try {
    if (!event.body) {
      return badRequest("요청 본문이 비어 있습니다.");
    }

    const parsed = noteUpdateSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().formErrors.join(", "));
    }

    const payload = parsed.data;
    const sql = getSqlClient();

    const result = await sql(
      `
        UPDATE notes
        SET title = $1,
            content = $2,
            category = $3,
            tags = $4::jsonb,
            attachments = $5::jsonb,
            updated_at = now()
        WHERE id = $6
        RETURNING id,
                  title,
                  content,
                  category,
                  tags,
                  attachments,
                  created_at AS "createdAt",
                  updated_at AS "updatedAt"
      `,
      [
        payload.title,
        payload.content,
        payload.category,
        JSON.stringify(payload.tags),
        JSON.stringify(payload.attachments),
        payload.id
      ]
    );

    if (result.length === 0) {
      return notFound("업데이트할 메모를 찾을 수 없습니다.");
    }

    return json(200, result[0]);
  } catch (error) {
    return handleError(error);
  }
};

export { handler };
