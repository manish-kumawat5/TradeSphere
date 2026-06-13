const prisma = require('../config/database');
const { sendOtpEmail } = require('./email.service'); // using existing email utility for SIP notifications (placeholder)

/**
 * Calculate next deduction date based on current nextDeduction and a monthly frequency.
 * For simplicity we assume monthly frequency only (can be extended).
 */
function addOneMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Process due SIPs – run periodically (e.g., every minute).
 */
async function processDueSips() {
  const now = new Date();
  const dueSips = await prisma.sip.findMany({
    where: {
      isActive: true,
      nextDeduction: { lte: now },
    },
  });

  for (const sip of dueSips) {
    try {
      const [user, fund] = await Promise.all([
        prisma.user.findUnique({ where: { id: sip.userId }, select: { walletBalance: true, email: true, name: true } }),
        prisma.mutualFund.findUnique({ where: { id: sip.fundId } }),
      ]);

      if (!user || !fund) {
        // Mark SIP inactive if data missing
        await prisma.sip.update({
          where: { id: sip.id },
          data: { isActive: false },
        });
        continue;
      }

      if (user.walletBalance < sip.monthlyAmount) {
        // Insufficient funds – deactivate SIP and notify user
        await prisma.sip.update({
          where: { id: sip.id },
          data: { isActive: false },
        });
        await sendOtpEmail(user.email, 'SIP Deactivation', user.name);
        continue;
      }

      const units = sip.monthlyAmount / fund.nav;

      await prisma.$transaction(async (tx) => {
        // Debit user wallet
        await tx.user.update({
          where: { id: user.id },
          data: { walletBalance: { decrement: sip.monthlyAmount } },
        });
        // Record transaction
        await tx.fundTransaction.create({
          data: {
            userId: user.id,
            fundId: fund.id,
            type: 'BUY',
            amount: sip.monthlyAmount,
            nav: fund.nav,
            units,
          },
        });
        // Update next deduction date
        await tx.sip.update({
          where: { id: sip.id },
          data: { nextDeduction: addOneMonth(sip.nextDeduction) },
        });
      });

      // Notify user of successful deduction
      await sendOtpEmail(user.email, 'SIP Deduction Successful', user.name);
    } catch (err) {
      console.error('❌ Error processing SIP', sip.id, err);
    }
  }
}

/**
 * Start the SIP scheduler – runs every minute.
 */
function startSipScheduler() {
  // Run immediately on start to catch any overdue SIPs
  processDueSips();
  setInterval(processDueSips, 60 * 1000); // every minute
  console.log('⏱ SIP scheduler started (runs every minute)');
}

module.exports = { startSipScheduler };
