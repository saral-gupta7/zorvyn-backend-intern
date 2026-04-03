type ErrorWithMessage = {
  message?: string;
};

export function handleRouteError(
  error: unknown,
  set: { status?: number },
  notFoundMessage?: string,
) {
  const message =
    error instanceof Error
      ? error.message
      : (error as ErrorWithMessage | null)?.message;

  if (notFoundMessage && message === notFoundMessage) {
    set.status = 404;
    return { error: message };
  }

  set.status = 500;
  return { error: "Internal server error" };
}
