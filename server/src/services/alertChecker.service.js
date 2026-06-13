const prisma = require('../config/database');

/**
 * Check active price alerts against live prices.
 * Called periodically from the main server tick.
 */
async function checkAlerts(livePrices) {
  try {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const alert of activeAlerts) {
      const currentPrice = livePrices[alert.symbol];
      if (currentPrice === undefined) continue;

      let triggered = false;
      if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        await prisma.$transaction(async (tx) => {
          await tx.priceAlert.update({
            where: { id: alert.id },
            data: { status: 'TRIGGERED', triggeredAt: new Date() },
          });

          await tx.notification.create({
            data: {
              userId: alert.userId,
              type: 'PRICE_ALERT',
              title: `Price Alert: ${alert.symbol}`,
              message: `${alert.symbol} has reached ₹${currentPrice.toFixed(2)} (target: ${alert.condition.toLowerCase()} ₹${alert.targetPrice.toFixed(2)})`,
              metadata: JSON.stringify({
                symbol: alert.symbol,
                targetPrice: alert.targetPrice,
                currentPrice,
                condition: alert.condition,
              }),
            },
          });
        });

        console.log(`🔔 Alert triggered: ${alert.symbol} @ ₹${currentPrice.toFixed(2)} (${alert.condition} ₹${alert.targetPrice})`);
      }
    }
  } catch (error) {
    console.error('Alert checker error:', error.message);
  }
}

module.exports = { checkAlerts };
