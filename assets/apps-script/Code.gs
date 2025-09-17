/*
Minimal Apps Script server: count visitors = number of registered users only.
Endpoints (via GET/POST):
 - action=register   (POST) -> fields: name, phone, year, token (optional) => returns {result:'success', uniqueId}
 - action=updateScore (POST) -> fields: uniqueId, score => updates registrations sheet score column
 - action=visitorGet  (GET)  -> returns {result:'success', count: N} where N = number of registered uniqueIds

Usage:
- Create a Google Spreadsheet and either set its ID in Script Properties under SPREADSHEET_ID
  or attach this script to the spreadsheet (use ActiveSpreadsheet fallback).
- Deploy as Web App (Execute as: Me, Who has access: Anyone, even anonymous).
*/

function doGet(e){ return handleRequest(e); }
function doPost(e){ return handleRequest(e); }

function handleRequest(e){
  const action = (e.parameter && e.parameter.action) || (e.postData && parsePostAction(e.postData)) || '';
  try {
    if (action === 'register') return registerEndpoint(e);
    if (action === 'updateScore') return updateScoreEndpoint(e);
    if (action === 'visitorGet' || action === 'visitorCount') return visitorGetEndpoint(e);
    return jsonResponse({ result: 'error', message: 'unknown action' });
  } catch(err){
    return jsonResponse({ result: 'error', message: String(err) });
  }
}

function parsePostAction(postData){
  try{
    if (!postData || !postData.contents) return '';
    // Try form-encoded first
    if (postData.type && postData.type.indexOf('application/x-www-form-urlencoded') !== -1) {
      const params = Utilities.parseQueryString(postData.contents);
      return params.action || '';
    }
    // Try JSON
    const obj = JSON.parse(postData.contents);
    return obj.action || '';
  } catch(e){
    return '';
  }
}

function registerEndpoint(e){
  // Expect POST form fields: name, phone, year, token(optional)
  const params = parsePostParams(e.postData);
  const name = (params.name || '').toString().trim();
  const phone = (params.phone || '').toString().trim();
  const year = (params.year || '').toString().trim();
  const token = (params.token || '').toString().trim();

  if (!name || !phone) return jsonResponse({ result: 'error', message: 'missing name or phone' });

  const ss = getSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'registrations', ['timestamp','name','phone','year','uniqueId','token','score']);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // Check for existing registration by phone to avoid duplicates
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const phones = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // phone is column 3
      for (let i = 0; i < phones.length; i++) {
        const p = String(phones[i][0] || '').trim();
        if (p && p === phone) {
          // existing registration found; return existing uniqueId and optionally update token
          const uid = sheet.getRange(i + 2, 5).getValue(); // uniqueId is column 5 (timestamp,name,phone,year,uniqueId,...)
          // update token column (6) if provided
          if (token) {
            sheet.getRange(i + 2, 6).setValue(token);
          }
          return jsonResponse({ result: 'success', uniqueId: String(uid), existed: true, row: i + 2 });
        }
      }
    }

    // New registration
    const uniqueId = Utilities.getUuid();
    const now = new Date().toISOString();
    const score = '';
    sheet.appendRow([now, name, phone, year, uniqueId, token, score]);
    const newRow = sheet.getLastRow();
    return jsonResponse({ result: 'success', uniqueId: uniqueId, existed: false, row: newRow });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

function updateScoreEndpoint(e){
  // Expect POST: uniqueId, score
  const params = parsePostParams(e.postData);
  const uniqueId = (params.uniqueId || '').toString().trim();
  const score = (params.score || '').toString().trim();
  if (!uniqueId) return jsonResponse({ result: 'error', message: 'missing uniqueId' });

  const ss = getSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'registrations', ['timestamp','name','phone','year','uniqueId','token','score']);

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0] || [];
  const uniqueIdx = headers.indexOf('uniqueId');
  const scoreIdx = headers.indexOf('score');
  if (uniqueIdx < 0 || scoreIdx < 0) return jsonResponse({ result: 'error', message: 'sheet missing columns' });

  for (let i = 1; i < values.length; i++){
    if (String(values[i][uniqueIdx]) === uniqueId) {
      sheet.getRange(i+1, scoreIdx+1).setValue(score);
      return jsonResponse({ result: 'success' });
    }
  }
  return jsonResponse({ result: 'error', message: 'uniqueId not found' });
}

// Visitor endpoints: return registered users count
function visitorGetEndpoint(e){
  var count = getRegisteredCount();
  return jsonResponse({ result: 'success', count: count });
}

/**
 * Helper: return number of registered uniqueIds in registrations sheet
 */
function getRegisteredCount(){
  try{
    var ss = getSpreadsheet();
    var sheet = getOrCreateSheet_(ss, 'registrations', ['timestamp','name','phone','year','uniqueId','token','score']);
    var last = sheet.getLastRow();
    if (last < 2) return 0;
    var vals = sheet.getRange(2, 5+1, last-1, 1).getValues(); // uniqueId column (6th column)
    var set = {};
    for (var i=0;i<vals.length;i++){
      var v = String(vals[i][0]||'').trim();
      if (v) set[v]=true;
    }
    return Object.keys(set).length;
  } catch (err) {
    return 0;
  }
}

// Helpers
function parsePostParams(postData){
  try{
    if (!postData) return {};
    if (postData.type && postData.type.indexOf('application/x-www-form-urlencoded') !== -1) {
      return Utilities.parseQueryString(postData.contents);
    }
    // JSON fallback
    return JSON.parse(postData.contents || '{}');
  } catch(e){ return {}; }
}

function getSpreadsheet(){
  const sid = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (sid) return SpreadsheetApp.openById(sid);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(ss, name, headers){
  let sheet = ss.getSheetByName(name);
  if (!sheet){
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else {
    // ensure headers exist
    const first = sheet.getRange(1,1,1,headers.length).getValues()[0];
    let need = false;
    for (let i = 0; i < headers.length; i++){
      if (first[i] !== headers[i]) { need = true; break; }
    }
    if (need) sheet.getRange(1,1,1,headers.length).setValues([headers]);
  }
  return sheet;
}

function jsonResponse(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
