export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

export const isCliError = (error: unknown): error is CliError =>
  error instanceof CliError;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
};

export const getExitCode = (error: unknown): number => {
  if (isCliError(error)) {
    return error.exitCode;
  }

  return 1;
};
