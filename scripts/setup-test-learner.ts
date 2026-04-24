// Setup test learner account with password
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test-learner@dojo.com";
  const password = "TestLearner123!"; // Test password

  console.log("Setting up test learner account...");
  console.log("Email:", email);
  console.log("Password:", password);

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user
  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log("\n✅ Test learner account ready!");
  console.log("\nLogin credentials:");
  console.log("==================");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role:", user.role);
  console.log("\nYou can now login at:");
  console.log("Local: http://localhost:3000/login");
  console.log("Production: https://do-jo.vercel.app/login");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
