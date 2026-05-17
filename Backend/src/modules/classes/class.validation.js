import { z } from "zod";

export const createClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(50),

  sequence: z
    .number()
    .int()
    .positive(),

  academicYear: z
    .string()
    .trim()
    .min(1)
    .max(20),
});

export const updateClassSchema =
  createClassSchema.partial();