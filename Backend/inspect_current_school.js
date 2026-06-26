import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const principals = await client.execute("SELECT id, clerk_id, email, school_name, active_academic_year FROM principals");
  console.log("Principals:");
  console.table(principals.rows);

  for (const p of principals.rows) {
    if (!p.clerk_id) continue;
    console.log(`\n--- School: ${p.school_name} (${p.clerk_id}), Active Year: ${p.active_academic_year} ---`);
    
    // Total active students in students table
    const activeStudents = await client.execute({
      sql: "SELECT COUNT(*) as count FROM students WHERE school_id = ? AND status = 'active'",
      args: [p.clerk_id]
    });
    console.log("Active students in studentsTable:", activeStudents.rows[0].count);

    // Enrollments count for the active academic year
    if (p.active_academic_year) {
      const activeEnrollments = await client.execute({
        sql: "SELECT COUNT(*) as count FROM enrollments WHERE school_id = ? AND academic_year = ? AND status IN ('active', 'promoted')",
        args: [p.clerk_id, p.active_academic_year]
      });
      console.log(`Enrollments in active year (${p.active_academic_year}):`, activeEnrollments.rows[0].count);
    }

    // Let's print classes and how many students are in each class's active year vs students table
    const classesInfo = await client.execute({
      sql: `
        SELECT 
          c.id, 
          c.name, 
          c.academic_year,
          (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.status = 'active') as students_table_count,
          (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.academic_year = c.academic_year AND e.status IN ('active', 'promoted')) as enrollment_table_count
        FROM classes c 
        WHERE c.school_id = ? AND c.is_archived = 0
        ORDER BY c.name
      `,
      args: [p.clerk_id]
    });
    console.log("Classes with student counts:");
    console.table(classesInfo.rows);
  }

  client.close();
}

main().catch(err => {
  console.error(err);
  if (client) client.close();
});
