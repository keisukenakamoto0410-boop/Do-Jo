// Re-export from prisma.ts for backwards compatibility
// All new code should import from @/lib/prisma instead
export { prisma as db } from "./prisma";
export { prisma as default } from "./prisma";
