import { z } from "zod";

export const allowedPaymentModes = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Cheque",
];

export const updateSchoolProfileSchema =
  z.object({
    schoolName:
      z.string().trim().min(1).max(120).optional(),

    address:
      z.string().trim().max(300).nullable().optional(),

    city:
      z.string().trim().max(80).nullable().optional(),

    state:
      z.string().trim().max(80).nullable().optional(),

    district:
      z.string().trim().max(80).nullable().optional(),

    pinCode:
      z.string().trim().max(12).nullable().optional(),

    mobile:
      z.string()
        .trim()
        .regex(
          /^\d{0,10}$/,
          "Mobile number must be up to 10 digits"
        )
        .nullable()
        .optional(),

    logoUrl:
      z.string().trim().max(500).nullable().optional(),

    logoFileId:
      z.string().trim().max(200).nullable().optional(),

    principalSignatureUrl:
      z.string().trim().max(500).nullable().optional(),

    principalSignatureFileId:
      z.string().trim().max(200).nullable().optional(),

    stampUrl:
      z.string().trim().max(500).nullable().optional(),

    stampFileId:
      z.string().trim().max(200).nullable().optional(),

    activeAcademicYear:
      z.string()
        .trim()
        .regex(/^\d{4}-\d{4}$/)
        .nullable()
        .optional(),

    latitude:
      z.number().nullable().optional(),

    longitude:
      z.number().nullable().optional(),

    language:
      z.enum(["en", "hi"]).optional(),
  });

export const academicYearSchema =
  z.object({
    year:
      z.string()
        .trim()
        .regex(
          /^\d{4}-\d{4}$/,
          "Academic year must be YYYY-YYYY"
        ),

    fromAcademicYear:
      z.string()
        .trim()
        .regex(/^\d{4}-\d{4}$/)
        .optional(),

    note:
      z.string().trim().optional(),

    archiveOldYear:
      z.boolean().optional(),
  });

export const settingsPreferencesSchema =
  z.object({
    receipt:
      z.object({
        prefix:
          z.string().trim().min(1).max(12).optional(),

        signature:
          z.boolean().optional(),

        stamp:
          z.boolean().optional(),

        footer:
          z.string().trim().max(300).optional(),
      }).optional(),

    paymentModes:
      z.array(
        z.enum(allowedPaymentModes)
      ).min(1).optional(),
  });

export const saveBotCredentialsSchema = z.object({
  activationCommand: z.string()
    .min(6, "Activation command must be at least 6 characters")
    .max(30, "Activation command must be under 30 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Activation command must be alphanumeric only"),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
});

