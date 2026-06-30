import { db } from "../src/cors/database/DB.Connect.js";
import { studentsTable } from "../src/cors/schema/students.schema.js";
import { getStudentDetailService } from "../src/modules/students/students.service.js";

async function run() {
  console.log("=== Checking Student Profile Data ===");
  
  // Find one active student in the DB
  const [student] = await db.select().from(studentsTable).limit(1);
  if (!student) {
    console.log("❌ No students found in the database!");
    process.exit(1);
  }

  console.log("Found student in DB:", {
    id: student.id,
    fullName: student.fullName,
    schoolId: student.schoolId,
  });

  try {
    const detail = await getStudentDetailService({
      schoolId: student.schoolId,
      studentId: student.id,
    });
    console.log("✅ getStudentDetailService resolved successfully!");
    console.log("Returned student details:", JSON.stringify(detail.student, null, 2));
    console.log("Returned class:", detail.class);
    console.log("Returned section:", detail.section);
    console.log("Returned fees count:", detail.fees?.length);
    console.log("Returned payments count:", detail.payments?.length);
  } catch (err) {
    console.error("❌ getStudentDetailService failed:", err);
  }

  process.exit(0);
}

run();
