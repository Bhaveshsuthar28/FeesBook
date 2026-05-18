import { z } from "zod";

const requiredString =
  z.string()
    .trim()
    .min(1);

const optionalString =
  z.string()
    .trim()
    .optional()
    .or(z.literal(""));

const statusSchema =
  z.enum([
    "active",
    "alumni",
    "previous",
  ]);

export const studentLifecycleSchema =
  z.object({
    note:
      optionalString,
    targetClassId:
      optionalString,
    targetSectionId:
      optionalString,
  });

export const bulkPromoteStudentsSchema =
  z.object({
    fromClassId:
      optionalString,
    fromSectionId:
      optionalString,
    targetClassId:
      optionalString,
    targetSectionId:
      optionalString,
    fromAcademicYear:
      optionalString,
    targetAcademicYear:
      optionalString,
    note:
      optionalString,
  });

export const dobRegex =
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

export const createStudentSchema =
  z.object({
    classId:
      requiredString,
    sectionId:
      requiredString,
    schoolRegisterNo:
      requiredString,
    firstName:
      requiredString,
    lastName:
      optionalString,
    fatherName:
      requiredString,
    dob:
      requiredString.regex(
        dobRegex,
        "DOB must be DD/MM/YYYY"
      ),
    phone:
      requiredString,
    gender:
      requiredString,
    aadharNo:
      optionalString,
    aadharVerificationStatus:
      optionalString,
    admissionDate:
      optionalString,
    photoUrl:
      optionalString,
    photoFileId:
      optionalString,
  });

export const updateStudentSchema =
  createStudentSchema
    .omit({
      classId: true,
      sectionId: true,
    })
    .extend({
      status:
        statusSchema.optional(),
    })
    .partial();

export const updateStudentFeeSchema =
  z.object({
    amount:
      z.number()
        .min(0),
    paidAmount:
      z.number()
        .min(0),
  });

export const recordStudentPaymentSchema =
  z.object({
    studentFeeId:
      requiredString,
    amount:
      z.number()
        .positive(),
    paidAt:
      z.number()
        .optional(),
    paymentMode:
      optionalString,
    note:
      optionalString,
  });

export const importStudentsSchema =
  z.object({
    classId:
      requiredString,
    sectionId:
      requiredString,
    fileName:
      requiredString,
    fileBase64:
      requiredString,
  });
