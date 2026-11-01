import dotenv from "dotenv";
import { ROLE } from "../../generated/prisma/enums.js";
import { prisma } from "../client.js";

dotenv.config();

/**
 * Sets one user's role on the database DATABASE_URL names. It is how a shop
 * owner gets the first admin account, so it is safe to prefix with the Atlas
 * URL the way `db:sync` is: one document changes, nothing else is touched.
 */

const USAGE =
  "Usage: pnpm --filter @repo/database db:role <email> <ADMIN|USER>";

const isRole = (value: string): value is ROLE =>
  (Object.values(ROLE) as string[]).includes(value);

const parseArgs = (argv: string[]): { email: string; role: ROLE } | null => {
  const [email, role, ...extra] = argv;
  if (!email || !role || !isRole(role) || extra.length > 0) {
    return null;
  }
  return { email, role };
};

const setRole = async (email: string, role: ROLE) => {
  // Credentials are in the URL, so only the host and database name are printed.
  const target = process.env.DATABASE_URL?.replace(/\/\/[^@]*@/, "//***@");
  console.log(
    `Setting the role of ${email} on ${target ?? "<no DATABASE_URL>"}`,
  );

  // The client hides deactivated accounts, so one of those is unknown here too.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new Error(`No active user has the email ${email}.`);
  }
  if (user.role === role) {
    console.log(`${email} is already ${role}; nothing was written.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${email}: ${user.role} -> ${role}`);
};

const args = parseArgs(process.argv.slice(2));
if (!args) {
  console.error(USAGE);
  process.exitCode = 1;
} else {
  await setRole(args.email, args.role)
    .catch((e: unknown) => {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
