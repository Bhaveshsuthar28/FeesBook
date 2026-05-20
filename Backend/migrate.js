// migrate.js – run once with: node migrate.js
import { createClient } from "@libsql/client";
import { env } from "./src/cors/config/env.js";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

const statements = [
  // ── 1. enrollments table ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS enrollments (
    id                TEXT    PRIMARY KEY,
    school_id         TEXT    NOT NULL,
    student_id        TEXT    NOT NULL,
    academic_year     TEXT    NOT NULL,
    class_id          TEXT    NOT NULL,
    section_id        TEXT    NOT NULL,
    roll_number       INTEGER,
    admission_type    TEXT    NOT NULL DEFAULT 'new',
    status            TEXT    NOT NULL DEFAULT 'active',
    promoted_from     TEXT,
    note              TEXT,
    created_at        INTEGER NOT NULL
  )`,

  // ── 2. unique index: one enrollment per student per academic year ─────
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_school_student_year_idx
      ON enrollments (school_id, student_id, academic_year)`,

  // ── 3. lookup index: all students in a class/section for a year ───────
  `CREATE INDEX IF NOT EXISTS school_year_class_section_idx
      ON enrollments (school_id, academic_year, class_id, section_id)`,

  // ── 4. lookup index: all enrollments for a student ────────────────────
  `CREATE INDEX IF NOT EXISTS school_student_idx
      ON enrollments (school_id, student_id)`,

  // ── 5. add currentEnrollmentId to students (safe – ignored if already exists) ──
  // SQLite doesn't support "ALTER TABLE … ADD COLUMN IF NOT EXISTS",
  // so we catch the error if the column already exists.
  `ALTER TABLE students ADD COLUMN current_enrollment_id TEXT`,
];

(async () => {
  let hadError = false;
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("✓", sql.slice(0, 60).replace(/\s+/g, " ") + "…");
    } catch (err) {
      if (
        err.message &&
        (err.message.includes("already exists") ||
          err.message.includes("duplicate column"))
      ) {
        console.warn("⚠ already exists (skipped):", sql.slice(0, 60).replace(/\s+/g, " ") + "…");
      } else {
        console.error("✗ FAILED:", err.message);
        console.error("  SQL:", sql.slice(0, 120));
        hadError = true;
      }
    }
  }

  if (!hadError) {
    console.log("\n✅  Migration completed successfully.");
  } else {
    console.log("\n⚠️  Migration finished with errors — check output above.");
    process.exit(1);
  }

  await client.close();
})();
