// src/cors/schema/students.schema.js

import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const studentsTable =
  sqliteTable(
    "students",
    {

      id:
        text("id")
          .primaryKey(),

      schoolId:
        text("school_id")
          .notNull(),

      classId:
        text("class_id")
          .notNull(),

      sectionId:
        text("section_id")
          .notNull(),

      schoolRegisterNo:
        text("school_register_no")
          .notNull(),

      rollNumber:
        integer("roll_number")
          .notNull(),

      firstName:
        text("first_name")
          .notNull(),

      lastName:
        text("last_name"),

      fullName:
        text("full_name")
          .notNull(),

      gender:
        text("gender")
          .notNull(),

      dob:
        text("dob")
          .notNull(),

      phone:
        text("phone")
          .notNull(),

      fatherName:
        text("father_name")
          .notNull(),

      motherName:
        text("mother_name"),

      aadharNo:
        text("aadhar_no"),

      aadharVerificationStatus:
        text("aadhar_verification_status"),

      admissionDate:
        text("admission_date"),

      photoUrl:
        text("photo_url"),

      photoFileId:
        text("photo_file_id"),

      status:
        text("status")
          .default("active"),

      lastAcademicYear:
        text("last_academic_year"),

      previousClassId:
        text("previous_class_id"),

      previousSectionId:
        text("previous_section_id"),

      leftAt:
        integer("left_at"),

      alumniAt:
        integer("alumni_at"),

      movementNote:
        text("movement_note"),

      currentEnrollmentId:
        text("current_enrollment_id"),

      createdAt:
        integer("created_at")
          .notNull(),
    },
    (table) => ({
      uniqueRegisterNo:
        uniqueIndex(
          "unique_student_register_no_idx"
        ).on(
          table.schoolId,
          table.schoolRegisterNo
        ),
    })
  );
