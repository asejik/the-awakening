/**
 * The Awakening Registration: Google Sheet mirror (Apps Script bound to the event Sheet).
 * Paste into Extensions → Apps Script of the TEST or LIVE Sheet.
 *
 * Supabase is the system of record (docs/PROJECT_PLAN.md, Revision 2). This script only:
 *   - copies new registrations into the Sheet every 5 minutes (and on "Awakening → Sync now")
 *   - pings /api/email-retry so failed confirmation emails are re-sent
 *   - emails ALERT_EMAIL a daily summary at 7am, and an alert when something is wrong (P03-01)
 *
 * Setup (once per Sheet):
 *   1. Project Settings → Script Properties:
 *        SUPABASE_URL, SUPABASE_SECRET_KEY, EVENT_SLUG
 *        RETRY_URL, RETRY_SECRET   (optional; skipped when unset)
 *        ALERT_EMAIL               (optional; who gets the summary and alerts)
 *        IS_LIVE = true            (LIVE Sheet only: alerts if any email was only logged)
 *   2. Run setupSheet, then installTrigger (approve the permission prompts).
 */

var TABS = {
  Registrations: [
    'id', 'created_at', 'code', 'full_name', 'gender', 'institution', 'institution_other',
    'department', 'phone', 'email', 'needs_transport', 'area', 'address', 'consent_at',
    'followup_optin', 'age_confirmed', 'source', 'synced_at',
  ],
  Winners: ['drawn_at', 'code', 'registration_id', 'status', 'round'],
  Log: ['at', 'level', 'action', 'message'],
};

// Written with a leading ' so Sheets keeps them as text: it drops the leading 0 of
// "08012345678" and turns a code like "2E45" into a number (found in M1).
var FORCE_TEXT = { phone: true, code: true };
var SYNC_BATCH = 500;
var ALERT_REPEAT_SECONDS = 21600; // the same alert at most every 6 hours

/** Creates or checks the tabs and headers. Safe to re-run. */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Africa/Lagos');

  Object.keys(TABS).forEach(function (name) {
    var headers = TABS[name];
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var hasData = sheet.getLastRow() > 1;

    if (sheet.getLastRow() > 0) {
      var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (existing.join('|') !== headers.join('|')) {
        if (hasData) {
          throw new Error('Tab "' + name + '" has data under different headers. Clear it by hand; nothing was changed.');
        }
        sheet.clear();
      }
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

/** Sync every 5 minutes; daily summary around 7am. Re-running replaces the old triggers. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'syncFromSupabase' || fn === 'dailyDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncFromSupabase').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(7).create();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Awakening').addItem('Sync now', 'syncNow').addToUi();
}

function syncNow() {
  var copied = syncFromSupabase();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    copied === null ? 'A sync is already running. Try again in a minute.' : copied + ' new registration(s) copied.',
    'Awakening');
}

/** Copies unsynced rows into the Registrations tab. Returns the number appended, or null if already running. */
function syncFromSupabase() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return null;
  try {
    var props = PropertiesService.getScriptProperties();
    var rows = rpc_('sheet_pending', { p_event: props.getProperty('EVENT_SLUG'), p_limit: SYNC_BATCH });
    var copied = 0;

    if (rows.length) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
      var headers = TABS.Registrations;
      var lastRow = sheet.getLastRow();
      var present = {};
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(function (r) { present[String(r[0])] = true; });
      }

      var now = new Date();
      var toAppend = rows
        .filter(function (r) { return !present[r.id]; })
        .map(function (r) {
          return headers.map(function (h) { return h === 'synced_at' ? now : cell_(h, r[h]); });
        });

      if (toAppend.length) {
        sheet.getRange(lastRow + 1, 1, toAppend.length, headers.length).setValues(toAppend);
        SpreadsheetApp.flush();
        copied = toAppend.length;
      }
      // Mark every fetched row, including ones already present (e.g. after a crash mid-run).
      rpc_('sheet_mark_synced', { p_ids: rows.map(function (r) { return r.id; }) });
    }

    pingRetry_();
    checkAlerts_();
    return copied;
  } catch (err) {
    log_('error', 'syncFromSupabase', String(err));
    alert_('sync-failing', 'Sheet sync is failing',
      'The Google Sheet copy could not sync from Supabase. Registration itself is unaffected.\n\nError: ' + String(err));
    throw err;
  } finally {
    lock.releaseLock();
  }
}

/** Emails ALERT_EMAIL when something needs a human (P03-01). */
function checkAlerts_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ALERT_EMAIL')) return;
  var s = rpc_('ops_summary', { p_event: props.getProperty('EVENT_SLUG') });
  if (s.exhausted > 0) {
    alert_('emails-exhausted', s.exhausted + ' confirmation email(s) failed 5 times',
      'These registrants never received their code by email (they did see it on screen). ' +
      'Check the Gmail account and SMTP_PASS, then reset email_attempts to 0 for those rows in Supabase to retry.');
  }
  if (s.failed >= 10) {
    alert_('emails-failing', s.failed + ' confirmation emails are failing',
      'Gmail may have hit its daily limit or the app password changed. They will keep retrying every 5 minutes.');
  }
  if (s.unsynced_oldest_minutes > 30) {
    alert_('sync-stalled', 'Sheet copy is ' + s.unsynced_oldest_minutes + ' minutes behind',
      s.unsynced + ' registration(s) are not in the Sheet yet. Try Awakening → Sync now; check the Log tab.');
  }
  if (props.getProperty('IS_LIVE') === 'true' && s.logged > 0) {
    alert_('logged-in-live', 'LIVE emails are in log mode',
      s.logged + ' registration(s) on LIVE had their email only logged, not sent. Set EMAIL_MODE=smtp in Vercel Production.');
  }
}

/** Daily summary at about 7am (trigger from installTrigger). */
function dailyDigest() {
  var props = PropertiesService.getScriptProperties();
  var to = props.getProperty('ALERT_EMAIL');
  if (!to) return;
  var s = rpc_('ops_summary', { p_event: props.getProperty('EVENT_SLUG') });
  MailApp.sendEmail(to, '[Awakening] Daily summary: ' + s.total + ' registered (+' + s.last_24h + ' in 24h)', [
    'Event: ' + props.getProperty('EVENT_SLUG'),
    '',
    'Total registrations: ' + s.total,
    'New in the last 24 hours: ' + s.last_24h,
    '',
    'Emails sent: ' + s.sent,
    'Emails failing (still retrying): ' + s.failed,
    'Emails failed 5 times (need attention): ' + s.exhausted,
    'Emails only logged (test mode): ' + s.logged,
    '',
    'Not yet in the Sheet: ' + s.unsynced,
  ].join('\n'));
}

function alert_(key, subject, body) {
  var to = PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL');
  if (!to) return;
  var cache = CacheService.getScriptCache();
  if (cache.get('alert:' + key)) return;
  try {
    MailApp.sendEmail(to, '[Awakening] ' + subject, body);
    cache.put('alert:' + key, '1', ALERT_REPEAT_SECONDS);
  } catch (err) {
    log_('error', 'alert', String(err));
  }
}

function cell_(header, value) {
  if (value === null || value === undefined) return '';
  var s = String(value);
  if (FORCE_TEXT[header]) return "'" + s;
  // Formula guard: never let user input be evaluated by Sheets.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function rpc_(fn, body) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SUPABASE_SECRET_KEY');
  var headers = { apikey: key };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys don't.
  if (key && key.indexOf('sb_') !== 0) headers.Authorization = 'Bearer ' + key;

  var res = UrlFetchApp.fetch(props.getProperty('SUPABASE_URL') + '/rest/v1/rpc/' + fn, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code >= 300) throw new Error(fn + ' failed: HTTP ' + code + ' ' + res.getContentText().slice(0, 200));
  var text = res.getContentText();
  return text ? JSON.parse(text) : null;
}

function pingRetry_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('RETRY_URL');
  if (!url) return;
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { Authorization: 'Bearer ' + props.getProperty('RETRY_SECRET') },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() >= 300) log_('warn', 'pingRetry', 'HTTP ' + res.getResponseCode());
  } catch (err) {
    log_('warn', 'pingRetry', String(err));
  }
}

function log_(level, action, message) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log')
      .appendRow([new Date(), level, action, String(message).slice(0, 500)]);
  } catch (ignored) { /* logging must never break a run */ }
}
