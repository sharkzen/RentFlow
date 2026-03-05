import prisma from "./lib/prisma";
import { hashPassword } from "./modules/auth/lib/password";
import logger from "./utils/logger";

async function main() {
  console.log("🌱 Starting initial data generation...");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables",
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (existingAdmin) {
    logger.info(`Admin user already exists.`);
  } else {
    const hashedPassword = await hashPassword(adminPassword);

    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    logger.info(`Admin user created successfully!`);
    logger.info(`Email: ${newAdmin.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during initialization:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
