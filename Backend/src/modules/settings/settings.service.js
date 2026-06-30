import crypto from "crypto";
import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";

import {
  db,
  sqlClient,
} from "../../cors/database/DB.Connect.js";

import { getCache, setCache, deleteCache } from "../../cors/cache/cache.service.js";
import { keys, TTL } from "../../cors/cache/cache.keys.js";

import {
  principals,
} from "../auth/auth.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import {
  classFeesTable,
} from "../../cors/schema/classFee.schema.js";

import {
  getClassCatalog,
  getCurrentAcademicYear,
  getPreviousAcademicYear,
} from "../classes/class.catalog.js";

import {
  checkProfileCompletion,
} from "../../cors/utils/profile.js";

const settingsColumns = [
  {
    name: "city",
    definition: "text",
  },
  {
    name: "state",
    definition: "text",
  },
  {
    name: "district",
    definition: "text",
  },
  {
    name: "pin_code",
    definition: "text",
  },
  {
    name: "logo_url",
    definition: "text",
  },
  {
    name: "logo_file_id",
    definition: "text",
  },
  {
    name: "principal_signature_url",
    definition: "text",
  },
  {
    name: "principal_signature_file_id",
    definition: "text",
  },
  {
    name: "latitude",
    definition: "integer",
  },
  {
    name: "longitude",
    definition: "integer",
  },
  {
    name: "stamp_url",
    definition: "text",
  },
  {
    name: "stamp_file_id",
    definition: "text",
  },
  {
    name: "active_academic_year",
    definition: "text",
  },
  {
    name: "receipt_prefix",
    definition: "text",
  },
  {
    name: "receipt_qr",
    definition: "integer",
  },
  {
    name: "receipt_signature",
    definition: "integer",
  },
  {
    name: "receipt_stamp",
    definition: "integer",
  },
  {
    name: "receipt_footer",
    definition: "text",
  },
  {
    name: "payment_modes",
    definition: "text",
  },
];

const defaultReceiptSettings = {
  prefix: "FB",
  signature: true,
  stamp: true,
  footer:
    "Thank you for your payment. This is a computer generated receipt.",
};

const defaultPaymentModes = [
  "Cash",
  "UPI",
  "Bank Transfer",
];

export const ensureSettingsColumns =
  async () => {
    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS principals (
        id integer PRIMARY KEY AUTOINCREMENT,
        clerk_id text NOT NULL UNIQUE,
        email text NOT NULL,
        name text NOT NULL,
        photo text,
        school_name text,
        school_address text,
        city text,
        state text,
        district text,
        pin_code text,
        mobile text,
        is_profile_complete integer DEFAULT false,
        created_at integer,
        logo_url text,
        logo_file_id text,
        principal_signature_url text,
        principal_signature_file_id text,
        stamp_url text,
        stamp_file_id text,
        active_academic_year text,
        latitude integer,
        longitude integer,
        receipt_prefix text,
        receipt_qr integer,
        receipt_signature integer,
        receipt_stamp integer,
        receipt_footer text,
        payment_modes text
      )
    `);

    const result =
      await sqlClient.execute(
        "PRAGMA table_info(principals)"
      );

    const existing =
      new Set(
        result.rows.map(
          (row) => row.name
        )
      );

    for (const column of settingsColumns) {
      if (!existing.has(column.name)) {
        await sqlClient.execute(
          `ALTER TABLE principals ADD COLUMN ${column.name} ${column.definition}`
        );
      }
    }
  };

const emptyProfile =
  (schoolId) => ({
    clerkId:
      schoolId,
    email:
      `${schoolId}@feesbook.local`,
    name:
      "Principal",
    photo:
      null,
    schoolName:
      null,
    address:
      null,
    mobile:
      null,
    city:
      null,
    state:
      null,
    district:
      null,
    pinCode:
      null,
    logoUrl:
      null,
    logoFileId:
      null,
    principalSignatureUrl:
      null,
    principalSignatureFileId:
      null,
    stampUrl:
      null,
    stampFileId:
      null,
    activeAcademicYear:
      getCurrentAcademicYear(),
    latitude:
      null,
    longitude:
      null,
    receiptPrefix:
      defaultReceiptSettings.prefix,
    receiptSignature:
      defaultReceiptSettings.signature,
    receiptStamp:
      defaultReceiptSettings.stamp,
    receiptFooter:
      defaultReceiptSettings.footer,
    paymentModes:
      JSON.stringify(
        defaultPaymentModes
      ),
  });

const normalizeProfile =
  (principal) => ({
    ...principal,
    latitude:
      principal.latitude === null ||
      principal.latitude === undefined
        ? null
        : Number(principal.latitude) /
          10000000,
    longitude:
      principal.longitude === null ||
      principal.longitude === undefined
        ? null
        : Number(principal.longitude) /
          10000000,
    isProfileComplete:
      checkProfileCompletion(
        principal
      ),
  });

export const getSchoolProfileService =
  async ({ schoolId }) => {
    const cacheKey = keys.schoolProfile(schoolId);
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [principal] =
      await db
        .select()
        .from(principals)
        .where(
          eq(
            principals.clerkId,
            schoolId
          )
        );

    if (principal) {
      const result = normalizeProfile(
        principal
      );
      await setCache(cacheKey, result, TTL.PROFILE);
      return result;
    }

    try {
      const [created] =
        await db
          .insert(principals)
          .values(
            emptyProfile(
              schoolId
            )
          )
          .returning();

      const result = normalizeProfile(
        created
      );
      await setCache(cacheKey, result, TTL.PROFILE);
      return result;
    } catch (insertErr) {
      // Handle race condition: another concurrent request already inserted this profile
      const isUniqueViolation =
        insertErr?.message?.includes("UNIQUE") ||
        insertErr?.message?.includes("SQLITE_CONSTRAINT") ||
        insertErr?.code === "SQLITE_CONSTRAINT" ||
        insertErr?.cause?.message?.includes("UNIQUE") ||
        insertErr?.cause?.message?.includes("SQLITE_CONSTRAINT") ||
        insertErr?.cause?.code === "SQLITE_CONSTRAINT" ||
        String(insertErr).includes("UNIQUE") ||
        String(insertErr).includes("SQLITE_CONSTRAINT");

      if (isUniqueViolation) {
        // Fetch the row the other request just inserted
        const [existing] = await db
          .select()
          .from(principals)
          .where(eq(principals.clerkId, schoolId));

        if (existing) {
          const result = normalizeProfile(existing);
          await setCache(cacheKey, result, TTL.PROFILE);
          return result;
        }
      }

      // Unknown error — rethrow
      throw insertErr;
    }
  };

export const updateSchoolProfileService =
  async ({
    schoolId,
    data,
  }) => {
    const [profile] = await db
      .select()
      .from(principals)
      .where(eq(principals.clerkId, schoolId));

    if (!profile) {
      throw new Error("School profile not found");
    }

    const updates = {
      ...data,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        "latitude"
      ) &&
      updates.latitude !== null
    ) {
      updates.latitude =
        Math.round(
          Number(updates.latitude) *
            10000000
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        "longitude"
      ) &&
      updates.longitude !== null
    ) {
      updates.longitude =
        Math.round(
          Number(updates.longitude) *
            10000000
        );
    }

    await db
      .update(principals)
      .set(updates)
      .where(
        eq(
          principals.id,
          profile.id
        )
      );

    await deleteCache(keys.schoolProfile(schoolId));

    if (Object.prototype.hasOwnProperty.call(updates, "activeAcademicYear")) {
      await deleteCache(keys.academicYear(schoolId));
    }

    const normalized = normalizeProfile({ ...profile, ...updates });

    // Persist the computed isProfileComplete flag to the DB
    if (normalized.isProfileComplete !== profile.isProfileComplete) {
      await db
        .update(principals)
        .set({ isProfileComplete: normalized.isProfileComplete })
        .where(eq(principals.id, profile.id));
    }

    return normalized;
  };

const parsePaymentModes =
  (value) => {
    if (!value) {
      return defaultPaymentModes;
    }

    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed) &&
        parsed.length > 0
        ? parsed
        : defaultPaymentModes;
    } catch {
      return defaultPaymentModes;
    }
  };

export const getSettingsPreferencesService =
  async ({ schoolId }) => {
    const profile =
      await getSchoolProfileService({
        schoolId,
      });

    return {
      receipt: {
        prefix:
          profile.receiptPrefix ||
          defaultReceiptSettings.prefix,
        signature:
          profile.receiptSignature ??
          defaultReceiptSettings.signature,
        stamp:
          profile.receiptStamp ??
          defaultReceiptSettings.stamp,
        footer:
          profile.receiptFooter ||
          defaultReceiptSettings.footer,
      },
      paymentModes:
        parsePaymentModes(
          profile.paymentModes
        ),
    };
  };

export const updateSettingsPreferencesService =
  async ({
    schoolId,
    data,
  }) => {
    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const updates = {};

    if (data.receipt) {
      if (
        Object.prototype.hasOwnProperty.call(
          data.receipt,
          "prefix"
        )
      ) {
        updates.receiptPrefix =
          data.receipt.prefix;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.receipt,
          "signature"
        )
      ) {
        updates.receiptSignature =
          data.receipt.signature;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.receipt,
          "stamp"
        )
      ) {
        updates.receiptStamp =
          data.receipt.stamp;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.receipt,
          "footer"
        )
      ) {
        updates.receiptFooter =
          data.receipt.footer;
      }
    }

    if (data.paymentModes) {
      updates.paymentModes =
        JSON.stringify(
          data.paymentModes
        );
    }

    if (
      Object.keys(updates)
        .length > 0
    ) {
      await db
        .update(principals)
        .set(updates)
        .where(
          eq(
            principals.id,
            profile.id
          )
        );

      // Receipt fields (receiptPrefix, receiptFooter) affect profile completeness,
      // so clear the school profile cache to re-compute isProfileComplete
      await deleteCache(keys.schoolProfile(schoolId));

      // Persist isProfileComplete to the DB so it stays in sync
      const merged = { ...profile, ...updates };
      const nowComplete = checkProfileCompletion(merged);
      if (nowComplete !== profile.isProfileComplete) {
        await db
          .update(principals)
          .set({ isProfileComplete: nowComplete })
          .where(eq(principals.id, profile.id));
      }
    }

    return getSettingsPreferencesService({
      schoolId,
    });
  };

export const getActiveAcademicYearService =
  async ({ schoolId }) => {
    const cacheKey = keys.academicYear(schoolId);
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const profile =
      await getSchoolProfileService({
        schoolId,
      });

    const result = (
      profile.activeAcademicYear ||
      getCurrentAcademicYear()
    );

    await setCache(cacheKey, result, TTL.ACADEMIC_YEAR);
    return result;
  };

export const getAcademicYearsService =
  async ({ schoolId }) => {
    const activeAcademicYear =
      await getActiveAcademicYearService({
        schoolId,
      });

    const classes =
      await db
        .select()
        .from(classesTable)
        .where(
          eq(
            classesTable.schoolId,
            schoolId
          )
        )
        .orderBy(
          asc(
            classesTable.academicYear
          )
        );

    const years =
      [
        ...new Set(
          classes.map(
            (singleClass) =>
              singleClass.academicYear
          )
        ),
      ]
        .filter(Boolean)
        .sort()
        .reverse();

    if (
      !years.includes(
        activeAcademicYear
      )
    ) {
      years.unshift(
        activeAcademicYear
      );
    }

    return {
      activeAcademicYear,
      currentAcademicYear:
        getCurrentAcademicYear(),
      previousAcademicYear:
        getPreviousAcademicYear(
          activeAcademicYear
        ),
      years:
        years.map((year) => {
          const yearClasses =
            classes.filter(
              (singleClass) =>
                singleClass.academicYear ===
                year
            );

          return {
            year,
            isActive:
              year ===
              activeAcademicYear,
            classes:
              yearClasses.length,
            archivedClasses:
              yearClasses.filter(
                (singleClass) =>
                  singleClass.isArchived
              ).length,
          };
        }),
    };
  };

const ensureAcademicYearStructure =
  async ({
    schoolId,
    fromAcademicYear,
    targetAcademicYear,
  }) => {
    const sourceClasses =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              fromAcademicYear
            )
          )
        );

    const existingClasses =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              targetAcademicYear
            )
          )
        );

    const targetByName =
      new Map(
        existingClasses.map(
          (singleClass) => [
            singleClass.name,
            singleClass,
          ]
        )
      );

    const sourceByName =
      new Map(
        sourceClasses.map(
          (singleClass) => [
            singleClass.name,
            singleClass,
          ]
        )
      );

    let createdClasses = 0;
    let copiedSections = 0;
    let copiedFees = 0;

    if (sourceClasses.length > 0) {
      for (const sourceClass of sourceClasses) {
        if (
          !targetByName.has(
            sourceClass.name
          )
        ) {
          const newClass = {
            id:
              crypto.randomUUID(),
            schoolId,
            name:
              sourceClass.name,
            sequence:
              sourceClass.sequence,
            academicYear:
              targetAcademicYear,
            isArchived:
              sourceClass.isArchived,
            createdAt:
              new Date(),
          };

          await db
            .insert(classesTable)
            .values(newClass);
          targetByName.set(
            newClass.name,
            newClass
          );
          createdClasses += 1;
        }
      }
    }

    for (const [
      className,
      sourceClass,
    ] of sourceByName) {
      const targetClass =
        targetByName.get(
          className
        );

      if (!targetClass) {
        continue;
      }

      const [
        sourceSections,
        targetSections,
        sourceFees,
        targetFees,
      ] =
        await Promise.all([
          db
            .select()
            .from(sectionsTable)
            .where(
              and(
                eq(
                  sectionsTable.schoolId,
                  schoolId
                ),
                eq(
                  sectionsTable.classId,
                  sourceClass.id
                ),
                eq(
                  sectionsTable.isArchived,
                  false
                )
              )
            ),
          db
            .select()
            .from(sectionsTable)
            .where(
              and(
                eq(
                  sectionsTable.schoolId,
                  schoolId
                ),
                eq(
                  sectionsTable.classId,
                  targetClass.id
                )
              )
            ),
          db
            .select()
            .from(classFeesTable)
            .where(
              and(
                eq(
                  classFeesTable.schoolId,
                  schoolId
                ),
                eq(
                  classFeesTable.classId,
                  sourceClass.id
                ),
                eq(
                  classFeesTable.isArchived,
                  false
                )
              )
            ),
          db
            .select()
            .from(classFeesTable)
            .where(
              and(
                eq(
                  classFeesTable.schoolId,
                  schoolId
                ),
                eq(
                  classFeesTable.classId,
                  targetClass.id
                )
              )
            ),
        ]);

      const targetSectionNames =
        new Set(
          targetSections.map(
            (section) =>
              section.name
          )
        );

      for (const sourceSection of sourceSections) {
        if (
          targetSectionNames.has(
            sourceSection.name
          )
        ) {
          continue;
        }

        await db
          .insert(sectionsTable)
          .values({
            id:
              crypto.randomUUID(),
            schoolId,
            classId:
              targetClass.id,
            name:
              sourceSection.name,
            isArchived:
              false,
            createdAt:
              new Date(),
          });
        copiedSections += 1;
      }

      const targetFeeTypeIds =
        new Set(
          targetFees.map(
            (fee) =>
              fee.feeTypeId
          )
        );

      for (const sourceFee of sourceFees) {
        if (
          targetFeeTypeIds.has(
            sourceFee.feeTypeId
          )
        ) {
          continue;
        }

        await db
          .insert(classFeesTable)
          .values({
            id:
              crypto.randomUUID(),
            schoolId,
            classId:
              targetClass.id,
            feeTypeId:
              sourceFee.feeTypeId,
            amount:
              sourceFee.amount,
            isDefault:
              sourceFee.isDefault,
            isArchived:
              false,
          });
        copiedFees += 1;
      }
    }

    return {
      createdClasses,
      copiedSections,
      copiedFees,
    };
  };

export const createAcademicYearService =
  async ({
    schoolId,
    data,
  }) => {
    const fromAcademicYear =
      data.fromAcademicYear ||
      getPreviousAcademicYear(
        data.year
      );

    const setup =
      await ensureAcademicYearStructure({
        schoolId,
        fromAcademicYear,
        targetAcademicYear:
          data.year,
      });

    await updateSchoolProfileService({
      schoolId,
      data: {
        activeAcademicYear:
          data.year,
      },
    });

    await deleteCache(keys.academicYear(schoolId));

    const {
      bulkPromoteStudentsService,
    } =
      await import(
        "../students/students.service.js"
      );

    const promotion =
      await bulkPromoteStudentsService({
        schoolId,
        data: {
          fromAcademicYear,
          targetAcademicYear:
            data.year,
          note:
            data.note ||
            "Academic year promotion from Settings",
        },
      });

    if (data.archiveOldYear) {
      await archiveAcademicYearService({
        schoolId,
        year:
          fromAcademicYear,
        archived: true,
      });
    }

    return {
      year:
        data.year,
      fromAcademicYear,
      ...setup,
      promotion,
    };
  };

export const setActiveAcademicYearService =
  async ({
    schoolId,
    year,
  }) => {
    const result = await updateSchoolProfileService({
      schoolId,
      data: {
        activeAcademicYear:
          year,
      },
    });
    await deleteCache(keys.academicYear(schoolId));
    return result;
  };

export const archiveAcademicYearService =
  async ({
    schoolId,
    year,
    archived,
  }) => {
    await db
      .update(classesTable)
      .set({
        isArchived:
          Boolean(archived),
      })
      .where(
        and(
          eq(
            classesTable.schoolId,
            schoolId
          ),
          eq(
            classesTable.academicYear,
            year
          )
        )
      );

    const yearClasses =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              year
            )
          )
        );

    const classIds = yearClasses.map(c => c.id);
    if (classIds.length > 0) {
      await db
        .update(sectionsTable)
        .set({
          isArchived: Boolean(archived),
        })
        .where(
          and(
            eq(sectionsTable.schoolId, schoolId),
            inArray(sectionsTable.classId, classIds)
          )
        );
    }

    return {
      year,
      archived:
        Boolean(archived),
      classes:
        yearClasses.length,
    };
  };
