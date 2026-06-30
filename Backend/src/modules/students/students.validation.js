import { z } from "zod";

const requiredString =
  z.string()
    .trim()
    .min(1);

const optionalString =
  z.string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal(""))
    .or(z.null());

const statusSchema =
  z.enum([
    "active",
    "alumni",
    "previous",
    "archived",
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

const nameRegex = /^[a-zA-Z\s]+$/;

const nameSchema = requiredString.regex(nameRegex, {
  message: "Name can only contain alphabets (a-z, A-Z) and spaces"
});

const optionalNameSchema = z.string()
  .trim()
  .nullable()
  .optional()
  .or(z.literal(""))
  .or(z.null())
  .refine(val => !val || nameRegex.test(val), {
    message: "Name can only contain alphabets (a-z, A-Z) and spaces"
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
      nameSchema,
    lastName:
      optionalNameSchema,
    fatherName:
      nameSchema,
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
      z.string()
        .trim()
        .nullable()
        .optional()
        .or(z.literal(""))
        .or(z.null())
        .refine(val => !val || /^\d{12}$/.test(val.replace(/[-\s]/g, "")), {
          message: "Aadhaar number must be exactly 12 digits"
        }),
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

export const upsertStudentFeeConcessionSchema =
  z.object({
    academicYear:
      optionalString,
    concessionType:
      z.enum([
        "scholarship",
        "sibling",
        "staff_child",
        "merit",
        "financial_aid",
        "other",
      ]),
    basis:
      z.enum([
        "percentage",
        "fixed",
      ]),
    basisValue:
      z.number()
        .positive(),
    remark:
      optionalString,
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
    remark:
      optionalString,
    transactionRef:
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

export const promoteStreamSchema = z.object({
  students: z.array(
    z.object({
      studentId:       z.string().min(1),
      targetClassId:   z.string().min(1),
      targetSectionId: z.string().min(1),
      note:            z.string().optional(),
    })
  ).min(1),
  fromAcademicYear:    z.string().optional(),
  targetAcademicYear:  z.string().optional(),
});

export const moveStudentStreamSchema = z.object({
  targetClassId:   requiredString,
  targetSectionId: requiredString,
  note:            optionalString,
});
