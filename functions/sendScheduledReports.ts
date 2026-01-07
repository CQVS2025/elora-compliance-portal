import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Scheduled Email Report Delivery
 * This function should be triggered by a cron job (daily, weekly, monthly)
 * It checks all users with email report preferences enabled and sends reports
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting scheduled report delivery...');

    // Fetch all email report preferences
    const allPreferences = await base44.asServiceRole.entities.EmailReportPreferences.list();

    if (!allPreferences || allPreferences.length === 0) {
      console.log('No email report preferences found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No users with email reports enabled',
        sentCount: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const results = {
      total: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Process each user's preferences
    for (const pref of allPreferences) {
      results.total++;

      // Skip if not enabled
      if (!pref.enabled) {
        console.log(`Skipping ${pref.user_email} - reports not enabled`);
        results.skipped++;
        continue;
      }

      // Check if it's time to send based on frequency
      const shouldSend = checkIfShouldSend(pref, now);

      if (!shouldSend) {
        console.log(`Skipping ${pref.user_email} - not scheduled for now`);
        results.skipped++;
        continue;
      }

      // Send the report
      try {
        console.log(`Sending report to ${pref.user_email}...`);

        // Invoke the sendEmailReport function
        await base44.asServiceRole.functions.invoke('sendEmailReport', {
          userEmail: pref.user_email,
          reportTypes: pref.report_types || [],
          includeCharts: pref.include_charts !== false,
          includeAiInsights: pref.include_ai_insights !== false
        });

        // Update next scheduled time
        const nextScheduled = calculateNextScheduled(pref.frequency, now);
        await base44.asServiceRole.entities.EmailReportPreferences.update(pref.id, {
          last_sent: now.toISOString(),
          next_scheduled: nextScheduled
        });

        console.log(`Successfully sent report to ${pref.user_email}`);
        results.sent++;

      } catch (error) {
        console.error(`Error sending report to ${pref.user_email}:`, error);
        results.failed++;
        results.errors.push({
          email: pref.user_email,
          error: error.message
        });
      }
    }

    console.log('Scheduled report delivery complete:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Scheduled report delivery complete',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scheduled reports function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Check if a report should be sent now based on frequency and last sent time
 */
function checkIfShouldSend(pref, now) {
  if (!pref.last_sent) {
    // Never sent before, send now
    return true;
  }

  const lastSent = new Date(pref.last_sent);
  const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);

  switch (pref.frequency) {
    case 'daily':
      // Send if more than 23 hours since last sent
      return hoursSinceLastSent >= 23;

    case 'weekly':
      // Send if more than 6.5 days (156 hours) since last sent
      return hoursSinceLastSent >= 156;

    case 'monthly':
      // Send if more than 29 days (696 hours) since last sent
      return hoursSinceLastSent >= 696;

    default:
      return false;
  }
}

/**
 * Calculate the next scheduled send time based on frequency
 */
function calculateNextScheduled(frequency, fromDate) {
  const nextDate = new Date(fromDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;

    default:
      // Default to weekly
      nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate.toISOString();
}
