import type { Handler } from "@netlify/functions";
import { getSqlClient } from "./_shared/db";
import { badRequest, handleError, json, methodNotAllowed, noContent } from "./_shared/http";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

  try {
    const sql = getSqlClient();
    const { id, search = "", category, tags } = event.queryStringParameters ?? {};

    if (id) {
      const result = await sql(
        `
          SELECT id, title, content, category, tags, attachments, created_at, updated_at
          FROM notes
          WHERE id = $1
        `,
        [id]
      );

      if (result.length === 0) {
        return badRequest("요청한 메모를 찾을 수 없습니다.");
      }

      return json(200, result[0]);
    }

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (category) {
      conditions.push(`category = $${values.length + 1}`);
      values.push(category);
    }

    if (search) {
      const placeholder = `$${values.length + 1}`;
      const likeValue = `%${search}%`;
      conditions.push(`(title ILIKE ${placeholder} OR content ILIKE ${placeholder})`);
      values.push(likeValue);
    }

    if (tags) {
      const tagList = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (tagList.length === 0) {
        return badRequest("태그 필터가 올바르지 않습니다.");
      }

      conditions.push(
        `EXISTS (
          SELECT 1
          FROM jsonb_array_elements(tags) tag
          WHERE tag->>'id' = ANY($${values.length + 1}::text[])
        )`
      );
      values.push(tagList);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await sql(
      `
        SELECT id,
               title,
               content,
               category,
               tags,
               attachments,
               created_at AS "createdAt",
               updated_at AS "updatedAt"
        FROM notes
        ${whereClause}
        ORDER BY updated_at DESC
      `,
      values
    );

    return json(200, rows);
  } catch (error) {
    return handleError(error);
  }
};

export { handler };
