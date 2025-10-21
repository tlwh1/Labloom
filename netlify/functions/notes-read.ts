import type { Handler } from "@netlify/functions";
import { getSqlClient, hasDatabaseConnection } from "./_shared/db";
import { badRequest, handleError, json, methodNotAllowed, noContent } from "./_shared/http";
import { localGetNote, localListNotes } from "./_shared/local-store";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

  try {
    const { id, search = "", category, tags } = event.queryStringParameters ?? {};
    const tagList =
      tags
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean) ?? [];

    if (tags && tagList.length === 0) {
      return badRequest("태그 필터가 올바르지 않습니다.");
    }

    if (!hasDatabaseConnection()) {
      if (id) {
        const note = await localGetNote(id);
        if (!note) {
          return badRequest("요청한 메모를 찾을 수 없습니다.");
        }
        return json(200, note);
      }

      const notes = await localListNotes({
        search,
        category: category ?? undefined,
        tags: tagList.length > 0 ? tagList : undefined
      });

      return json(200, notes);
    }

    const sql = getSqlClient();

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

    if (tagList.length > 0) {
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
