import type { Context } from "hono";

export function successResponse<T>(c: Context, data: T, status = 200) {
  return c.json(
    {
      success: true,
      data,
    },
    status as 200 | 201,
  );
}

export function errorResponse(
  c: Context,
  message: string,
  status = 500,
  code?: string,
) {
  return c.json(
    {
      success: false,
      error: {
        message,
        code: code ?? `HTTP_${status}`,
      },
    },
    status as 400 | 401 | 404 | 500,
  );
}

export function validationErrorResponse(
  c: Context,
  errors: Record<string, string[]>,
) {
  return c.json(
    {
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
      },
    },
    400,
  );
}
