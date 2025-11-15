import cron from 'node-cron';
import { prisma } from '../config/database';

/**
 * Cron job to reset temporary curfew overrides at 6:00 AM every day
 * Only resets APPROVED_TEMPORARY, not APPROVED_PERMANENT
 * Runs at 6:00 AM Vietnam time
 */
export const initializeCurfewResetJob = () => {
  // Schedule: At 06:00 AM every day
  // Format: minute hour day month weekday
  cron.schedule('0 6 * * *', async () => {
    try {
      console.log(`[Cron] Starting curfew reset job at ${new Date().toISOString()}`);
      
      // Get all tenants with temporary approval
      const tenantsToReset = await prisma.tenant.findMany({
        where: {
          curfewStatus: 'APPROVED_TEMPORARY'
        },
        select: {
          id: true,
          name: true
        }
      });

      if (tenantsToReset.length === 0) {
        console.log('[Cron] No temporary curfew approvals to reset');
        return;
      }

      // Get system admin for logging
      const systemAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      if (!systemAdmin) {
        console.error('[Cron] No admin user found for system operations');
        return;
      }

      // Reset each tenant and create modification logs
      for (const tenant of tenantsToReset) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            curfewStatus: 'NORMAL',
            curfewApprovedAt: null,
            curfewApprovedBy: null
          }
        });

        // Create modification log
        await prisma.curfewModification.create({
          data: {
            tenantId: tenant.id,
            modifiedBy: systemAdmin.id,
            oldStatus: 'APPROVED_TEMPORARY',
            newStatus: 'NORMAL',
            modificationType: 'RESET',
            reason: 'Automatic reset at 6:00 AM',
            isPermanent: false
          }
        });
      }

      console.log(`[Cron] Successfully reset curfew override for ${tenantsToReset.length} tenant(s)`);
    } catch (error) {
      console.error('[Cron] Error resetting curfew overrides:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh" // Vietnam timezone
  });

  console.log('✅ Curfew reset cron job initialized (runs daily at 6:00 AM, resets temporary approvals only)');
};
