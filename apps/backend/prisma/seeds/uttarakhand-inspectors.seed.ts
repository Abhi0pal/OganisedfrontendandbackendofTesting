import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function seedUttarakhandInspectors(prisma: PrismaClient) {
  try {
    console.log("  Seeding Uttarakhand Inspectors (Districts 539-551)...");

    const inspectorRole = await prisma.roles.findFirst({
      where: { name: "Inspector" },
    });
    if (!inspectorRole) {
      console.log("  Missing 'Inspector' role. Cannot seed inspectors.");
      return;
    }

    // Some databases in local/dev do not have this legacy table.
    const tableCheck = await prisma.$queryRawUnsafe<
      Array<{ regclass_text: string | null }>
    >("SELECT to_regclass('public.department_users')::text AS regclass_text");

    if (!tableCheck[0]?.regclass_text) {
      console.log(
        "  Table public.department_users not found. Skipping Uttarakhand inspector seed.",
      );
      return;
    }

    const defaultPassword = await bcrypt.hash("user@123", 10);

    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    if (departments.length === 0) {
      console.log("  No active departments found to seed inspectors for.");
      return;
    }

    const minDistrictId = 539;
    const maxDistrictId = 551;
    let seededCount = 0;

    for (const dept of departments) {
      for (let distId = minDistrictId; distId <= maxDistrictId; distId++) {
        const cleanAbbr = (dept.abbreviation || `dept${dept.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const email = `inspector_${cleanAbbr}_${distId}@example.com`;

        let user = await prisma.users.findFirst({ where: { email } });

        if (!user) {
          user = await prisma.users.create({
            data: {
              email,
              password_hash: defaultPassword,
              password_algo: "bcrypt",
              user_type: "INSPECTOR",
              is_email_verified: 1,
              role_id: inspectorRole.id,
            },
          });
        }

        const existingProfile = await prisma.department_users.findUnique({
          where: { user_id: user.id },
        });

        if (!existingProfile) {
          await prisma.department_users.create({
            data: {
              user_id: user.id,
              full_name: `Inspector ${dept.abbreviation} (Dist ${distId})`,
              email,
              dept_id: dept.id,
              district_id: distId,
              status: 1,
              np_user_id: String(inspectorRole.id),
            },
          });
          seededCount++;
        }
      }
    }

    console.log(
      `  Successfully seeded ${seededCount} new District Inspectors for Uttarakhand.`,
    );
  } catch (error) {
    console.error("  Uttarakhand inspector seeding failed:", error);
    throw error;
  }
}
