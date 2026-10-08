/**
 * The Awakening Registration: Google Sheet mirror (Apps Script bound to the event Sheet).
 * Paste into Extensions → Apps Script of the TEST or LIVE Sheet.
 *
 * Supabase is the system of record (docs/PROJECT_PLAN.md, Revision 2). This script only:
 *   - copies new registrations into the Sheet every 5 minutes (and on "Awakening → Sync now")
 *   - pings /api/email-retry so failed confirmation emails are re-sent
 *
 * Setup (once per Sheet):
 *   1. Project Settings → Script Properties:
 *        SUPABASE_URL, SUPABASE_SECRET_KEY, EVENT_SLUG
 *        RETRY_URL, RETRY_SECRET   (optional; skipped when unset)
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

/** Runs syncFromSupabase every 5 minutes. Re-running replaces the old trigger. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncFromSupabase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncFromSupabase').timeBased().everyMinutes(5).create();
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
    return copied;
  } catch (err) {
    log_('error', 'syncFromSupabase', String(err));
    throw err;
  } finally {
    lock.releaseLock();
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
