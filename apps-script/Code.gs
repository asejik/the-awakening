/**
 * The Awakening Registration: Apps Script bound to the event Google Sheet.
 * Paste into Extensions → Apps Script of BOTH the test and the prod Sheet.
 *
 * setupSheet(): run once per Sheet. doPost: the web app called by Vercel
 * (register, setEmailStatus; draw and markWinner arrive in M6).
 * See docs/PROJECT_PLAN.md §4 and §6.
 */

var TABS = {
  Registrations: [
    'id', 'created_at', 'code', 'full_name', 'gender', 'institution',
    'institution_other', 'department', 'phone', 'email', 'needs_transport',
    'area', 'address', 'consent_at', 'followup_optin', 'age_confirmed',
    'email_status', 'email_attempts', 'emailed_at', 'source',
  ],
  Winners: ['drawn_at', 'code', 'registration_id', 'status', 'round'],
  Log: ['at', 'level', 'action', 'message'],
};

// Columns stored as plain text so Sheets never turns "08012345678" into a number
// or a code like "1E10" into a formula/number.
var TEXT_COLUMNS = { Registrations: ['code', 'phone'] };

/** Run once per Sheet from the Apps Script editor (Run → setupSheet). Safe to re-run. */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Africa/Lagos');

  Object.keys(TABS).forEach(function (name) {
    var headers = TABS[name];
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

    if (sheet.getLastRow() > 0) {
      var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (existing.join('|') !== headers.join('|')) {
        throw new Error('Tab "' + name + '" already has data with different headers. Fix it by hand; nothing was changed.');
      }
    } else {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    }
    sheet.setFrozenRows(1);

    (TEXT_COLUMNS[name] || []).forEach(function (col) {
      var idx = headers.indexOf(col) + 1;
      sheet.getRange(1, idx, sheet.getMaxRows(), 1).setNumberFormat('@');
    });
  });

  // Remove the default empty "Sheet1" if present.
  var blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

/* ------------------------------------------------------------------ */
/* Web app (M1). Deploy: Execute as Me, Who has access: Anyone.        */
/* Script Properties: GAS_SECRET (same value as Vercel env GAS_SECRET) */
/* ------------------------------------------------------------------ */

// No 0/O/1/I/L: codes are read aloud at the draw and typed on phones.
var CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
var LOCK_WAIT_MS = 25000; // Vercel fetch timeout is 28s, function limit 30s
var RESEND_THROTTLE_SECONDS = 600;

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty('GAS_SECRET');
    if (!expected || req.secret !== expected) {
      out = { status: 'unauthorized' };
    } else if (req.action === 'register') {
      out = register_(req.payload);
    } else if (req.action === 'setEmailStatus') {
      out = setEmailStatus_(req.payload);
    } else {
      out = { status: 'error', message: 'unknown action' };
    }
  } catch (err) {
    log_('error', 'doPost', String(err));
    out = { status: 'error', message: 'server error' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function register_(p) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { status: 'busy' };
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
    var headers = TABS.Registrations;
    var col = indexOf_(headers);
    var lastRow = sheet.getLastRow();
    // Read only up to the email column (id … email); the lock is held while this runs.
    var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, col.email + 1).getValues() : [];

    var phoneKey = phoneKey_(p.phone);
    var codes = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (phoneKey_(r[col.phone]) === phoneKey || String(r[col.email]).toLowerCase() === p.email) {
        var id = String(r[col.id]);
        var cache = CacheService.getScriptCache();
        var resend = !cache.get('resend:' + id);
        if (resend) cache.put('resend:' + id, '1', RESEND_THROTTLE_SECONDS);
        return {
          status: 'duplicate', id: id, code: String(r[col.code]),
          email: String(r[col.email]), full_name: String(r[col.full_name]), resend: resend,
        };
      }
      codes[String(r[col.code])] = true;
    }

    var code;
    do { code = randomCode_(); } while (codes[code]);

    var now = new Date();
    var record = {
      // Leading ' forces text: Sheets would turn 0801… into 801… and a code like 2E45 into a number.
      id: Utilities.getUuid(), created_at: now, code: "'" + code,
      full_name: p.full_name, gender: p.gender, institution: p.institution,
      institution_other: p.institution_other, department: p.department,
      phone: "'" + p.phone, email: p.email, needs_transport: p.needs_transport,
      area: p.area, address: p.address, consent_at: now,
      followup_optin: p.followup_optin, age_confirmed: p.age_confirmed,
      email_status: 'PENDING', email_attempts: 0, emailed_at: '', source: p.source,
    };
    sheet.appendRow(headers.map(function (h) { return safe_(record[h]); }));
    SpreadsheetApp.flush();
    return { status: 'created', id: record.id, code: code };
  } finally {
    lock.releaseLock();
  }
}

function setEmailStatus_(p) {
  if (['SENT', 'FAILED', 'LOGGED'].indexOf(p.email_status) === -1) return { status: 'error', message: 'bad status' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  var col = indexOf_(TABS.Registrations);
  var cell = sheet.getRange(2, col.id + 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .createTextFinder(String(p.id)).matchEntireCell(true).findNext();
  if (!cell) return { status: 'error', message: 'id not found' };

  var row = cell.getRow();
  var attempts = Number(sheet.getRange(row, col.email_attempts + 1).getValue()) || 0;
  sheet.getRange(row, col.email_status + 1).setValue(p.email_status);
  sheet.getRange(row, col.email_attempts + 1).setValue(attempts + 1);
  if (p.email_status === 'SENT') sheet.getRange(row, col.emailed_at + 1).setValue(new Date());
  return { status: 'ok' };
}

/** Compares phones by digits without the leading 0, so rows stored as numbers still match. */
function phoneKey_(v) {
  return String(v).replace(/\D/g, '').replace(/^0/, '');
}

function randomCode_() {
  var s = '';
  for (var i = 0; i < 4; i++) s += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  return s;
}

/** Stops user input from being evaluated as a formula. Dates and numbers pass through. */
function safe_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function indexOf_(headers) {
  var m = {};
  headers.forEach(function (h, i) { m[h] = i; });
  return m;
}

function log_(level, action, message) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log')
      .appendRow([new Date(), level, action, String(message).slice(0, 500)]);
  } catch (ignored) { /* logging must never break a request */ }
}
