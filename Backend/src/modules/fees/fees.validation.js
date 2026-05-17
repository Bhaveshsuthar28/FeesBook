import { z } from "zod";

export const createFeeTypeSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(50),

    defaultAmount:
      z.number().positive(),

    isOptional:
      z.boolean(),
  });

export const updateFeeTypeSchema =
  createFeeTypeSchema.partial();

export const assignFeeToClassSchema =
  z.object({
    classId:
      z.string(),

    feeTypeId:
      z.string(),

    amount:
      z.number().positive(),

    isDefault:
      z.boolean(),
  });

export const updateClassFeeSchema =
  assignFeeToClassSchema.partial();