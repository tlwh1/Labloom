const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
} as const;

type HeadersInit = Record<string, string>;

export function json(statusCode: number, body: unknown, headers: HeadersInit = {}) {
  return {
    statusCode,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export function noContent() {
  return {
    statusCode: 204,
    headers: DEFAULT_HEADERS,
    body: ""
  };
}

export function methodNotAllowed(methods: string[]) {
  return json(
    405,
    {
      error: "METHOD_NOT_ALLOWED",
      message: `허용되지 않은 메서드입니다. 사용 가능: ${methods.join(", ")}`
    },
    { Allow: methods.join(", ") }
  );
}

export function handleError(error: unknown) {
  console.error(error);
  return json(500, {
    error: "INTERNAL_SERVER_ERROR",
    message: "요청을 처리하는 중 문제가 발생했습니다."
  });
}

export function badRequest(message: string) {
  return json(400, {
    error: "BAD_REQUEST",
    message
  });
}

export function notFound(message: string) {
  return json(404, {
    error: "NOT_FOUND",
    message
  });
}
