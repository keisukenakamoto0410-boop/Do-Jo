import { db } from "@/lib/db";

async function checkStudentUsers() {
  console.log("Checking for users with student role...");

  const studentUsers = await db.user.findMany({
    where: {
      role: "student",
    },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      createdAt: true,
    },
  });

  console.log(`\nFound ${studentUsers.length} student users:`);

  if (studentUsers.length > 0) {
    console.table(studentUsers);
  } else {
    console.log("No student users found.");
  }

  await db.$disconnect();
}

checkStudentUsers().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
