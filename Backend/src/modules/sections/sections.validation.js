import { z } from "zod";

export const createSectionSchema =
  z.object({
    classId:
      z.string(),

    name: z
      .string()
      .trim()
      .min(1)
      .max(10),
  });

export const updateSectionSchema =
  createSectionSchema.partial();