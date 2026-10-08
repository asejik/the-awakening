/**
 * The Awakening Registration: Apps Script bound to the event Google Sheet.
 * Paste into Extensions → Apps Script of BOTH the test and the prod Sheet.
 *
 * M0: setupSheet() only. The doPost router (register, setEmailStatus, draw,
 * markWinner) arrives in M1. See docs/PROJECT_PLAN.md §4 and §6.
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
