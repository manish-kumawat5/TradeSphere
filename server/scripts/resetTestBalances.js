const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { transactions: { none: {} } },
    data: { walletBalance: 0 }
  });
  console.log('Reset balances for users with no transactions');
}
main().finally(() => prisma.$disconnect());
