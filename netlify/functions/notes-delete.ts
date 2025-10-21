import type { Handler } from "@netlify/functions";
import { getSqlClient } from "./_shared/db";
import { badRequest, handleError, json, methodNotAllowed, noContent, notFound } from "./_shared/http";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "DELETE") {
    return methodNotAllowed(["DELETE", "OPTIONS"]);
  }

  const id = event.queryStringParameters?.id;

  if (!id) {
    return badRequest("삭제할 메모 ID가 필요합니다.");
  }

  try {
    const sql = getSqlClient();
    const result = await sql(
      `
        DELETE FROM notes
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.length === 0) {
      return notFound("삭제할 메모를 찾을 수 없습니다.");
    }

    return json(200, { id });
  } catch (error) {
    return handleError(error);
  }
};

export { handler };
