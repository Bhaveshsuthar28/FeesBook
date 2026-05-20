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

    frequency:
      z.enum([
        "Monthly",
        "Quarterly",
        "Yearly",
      ]).optional(),

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

export const archiveSchema =
  z.object({
    isArchived:
      z.boolean().optional(),
  });

export const allocateClassFeesSchema =
  z.object({
    classId:
      z.string().min(1),

    sectionId:
      z.string().min(1).optional(),

    studentIds:
      z.array(
        z.string().min(1)
      ).optional(),

    feeTypeIds:
      z.array(
        z.string().min(1)
      ).min(1),
  });
