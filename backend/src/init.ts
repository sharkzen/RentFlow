import prisma from "./lib/prisma";
import { hashPassword } from "./modules/auth/lib/password";
import logger from "./utils/logger";
import { env } from "./config/env";

async function main() {
  console.log("🌱 Starting initial data generation...");
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;

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

  const featureKey = "OCR_BILL";

  const existingFeature = await prisma.feature.findUnique({
    where: {
      key: featureKey,
    },
  });

  if (existingFeature) {
    logger.info(`Feature '${featureKey}' already exists.`);
  } else {
    await prisma.feature.create({
      data: {
        key: featureKey,
        name: "OCR สแกนน้ำไฟ",
        enabled: true,
      },
    });

    logger.info(`Feature '${featureKey}' created successfully!`);
  }

  // แพ็คเกจเริ่มต้น (แอดมินแก้ไขราคา/โควต้าได้ภายหลังในหน้าแอดมิน)
  const initialPlans = [
    {
      name: "FREE",
      description: "ลงประกาศหอพักฟรี",
      priceMonthly: 0,
      maxDorms: 1,
      maxRooms: 12,
      slipQuotaMonthly: 0,
      isFree: true,
      allowTrial: false,
      sortOrder: 0,
    },
    {
      name: "START",
      description: "เริ่มต้นใช้งานระบบจัดการหอพัก",
      priceMonthly: 199,
      maxDorms: 1,
      maxRooms: 12,
      slipQuotaMonthly: 30,
      sortOrder: 1,
    },
    {
      name: "STANDARD",
      priceMonthly: 399,
      maxDorms: 3,
      maxRooms: 40,
      slipQuotaMonthly: 100,
      sortOrder: 2,
    },
    {
      name: "PRO",
      priceMonthly: 799,
      maxDorms: 10,
      maxRooms: 150,
      slipQuotaMonthly: 350,
      sortOrder: 3,
    },
    {
      name: "BUSINESS",
      priceMonthly: 1499,
      maxDorms: 999,
      maxRooms: 400,
      slipQuotaMonthly: 900,
      sortOrder: 4,
    },
  ];

  if ((await prisma.plan.count()) === 0) {
    await prisma.plan.createMany({ data: initialPlans });
    logger.info("Default plans created successfully!");
  } else {
    logger.info("Plans already exist.");
  }

  const initialLandmarks = [
    {
      name: "ตลาดต้นสน",
      slug: "ton-son-market",
      type: "MARKET",
      latitude: 16.19968,
      longitude: 103.26275,
      mapUrl: "https://maps.google.com/?q=16.19968,103.26275",
    },
    {
      name: "ตี๋น้อยหน้าเสริมไทย",
      slug: "tee-noi-sermthai",
      type: "RESTAURANT",
      latitude: 16.20234,
      longitude: 103.27568,
      mapUrl: "https://maps.google.com/?q=16.20234,103.27568",
    },
    {
      name: "มหาวิทยาลัยราชภัฏมหาสารคาม",
      slug: "rmu",
      type: "UNIVERSITY",
      latitude: 16.20076,
      longitude: 103.27101,
      mapUrl: "https://maps.google.com/?q=16.20076,103.27101",
    },
    {
      name: "เสริมไทยคอมเพล็กซ์",
      slug: "sermthai-complex",
      type: "SHOPPING_MALL",
      latitude: 16.20179,
      longitude: 103.27648,
      mapUrl: "https://maps.google.com/?q=16.20179,103.27648",
    },
    {
      name: "มอเก่าสารคาม",
      slug: "msu-old-campus",
      type: "UNIVERSITY",
      latitude: 16.20020,
      longitude: 103.28207,
      mapUrl: "https://maps.google.com/?q=16.20020,103.28207",
    },
    {
      name: "มหาวิทยาลัยมหาสารคาม",
      slug: "mahasarakham-university",
      type: "UNIVERSITY",
      latitude: 16.24403,
      longitude: 103.24903,
      mapUrl: "https://maps.google.com/?q=16.24403,103.24903",
    },
  ];

  for (const landmark of initialLandmarks) {
    const existingLandmark = await prisma.landmark.findUnique({
      where: {
        slug: landmark.slug,
      },
    });

    if (existingLandmark) {
      logger.info(`Landmark '${landmark.mapUrl}' already exists.`);
    } else {
      await prisma.landmark.create({
        data: landmark as any,
      });

      logger.info(`Landmark '${landmark.mapUrl}' created successfully!`);
    }
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
