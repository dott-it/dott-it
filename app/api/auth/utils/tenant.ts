import { userPrisma } from "@/lib/user-prisma";

// Initialize Prisma Client for the user database
const userDb =userPrisma

/**
 * Retrieves the tenant associated with a given email domain.
 *
 * @param email - The user's email address.
 * @returns The tenant object if found, otherwise null.
 */
export async function getTenantByEmail(email: string): Promise<ReturnType<typeof userDb.tenant.findFirst> | null> {
  if (!email) {
    return null;
  }

  const domain = email.split('@').pop();
  console.log(domain)
  if (!domain) {
    return null;
  }

  try {
    const tenant = await userDb.tenant.findFirst({
      where: {
        domains: {
          has: domain,
        },
      },
    });

    return tenant;
  } catch (error) {
    console.error("Error fetching tenant by domain:", error);
    return null;
  }
}
