import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  try {
    const studentsRes = await client.execute("SELECT id, school_id, class_id, section_id, roll_number, status FROM students WHERE status='active'");
    const students = studentsRes.rows;
    console.log(`Total active students: ${students.length}`);

    const classesRes = await client.execute("SELECT id, academic_year FROM classes");
    const classesMap = new Map(classesRes.rows.map(c => [c.id, c.academic_year]));

    const enrollmentsRes = await client.execute("SELECT student_id, class_id, academic_year FROM enrollments");
    const enrollmentsSet = new Set(enrollmentsRes.rows.map(e => `${e.student_id}:${e.class_id}`));

    let backfilledCount = 0;
    for (const student of students) {
      const key = `${student.id}:${student.class_id}`;
      if (!enrollmentsSet.has(key)) {
        const academicYear = classesMap.get(student.class_id) || "2026-2027";
        const enrollmentId = crypto.randomUUID();
        
        await client.execute({
          sql: "INSERT INTO enrollments (id, school_id, student_id, academic_year, class_id, section_id, roll_number, admission_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'active', ?)",
          args: [
            enrollmentId,
            student.school_id,
            student.id,
            academicYear,
            student.class_id,
            student.section_id,
            student.roll_number,
            Date.now()
          ]
        });

        await client.execute({
          sql: "UPDATE students SET current_enrollment_id = ? WHERE id = ?",
          args: [enrollmentId, student.id]
        });

        console.log(`Backfilled enrollment for student ID: ${student.id} in class: ${student.class_id} (${academicYear})`);
        backfilledCount++;
      }
    }
    console.log(`\nTotal enrollments backfilled: ${backfilledCount}`);
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await client.close();
  }
}

main();
