import { clsx, type ClassValue } from "clsx";
import { type ZodSchema } from "zod";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseInput<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => {
        const path = i.path.join(".");
        return path ? `${path}: ${i.message}` : i.message;
      })
      .join("; ");
    throw new Error(msg);
  }
  return result.data;
}
