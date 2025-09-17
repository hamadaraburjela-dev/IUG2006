/**
 // Code.gs - كود مُحسّن للتزامن، كاش، ومفتاح حماية
*/

const COLS = {
  TIMESTAMP: 1,
  FULLNAME: 2,
  PHONE: 3,
  YEAR: 4,
  SCORE: 5,
  UNIQUE_ID: 6
};

// خزّن ID الشيت في Script Properties بدلاً من الكود الثابت إن أمكن
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '1QVkXMhQ2OyI2SQFu8kt6I6YxmWNuLDwTyAnE63RJq-8';
const SHEET_NAME = 'Sheet1';
const CACHE_PREFIX = 'id_'; // prefix لمفاتيح الكاش
const CACHE_TTL = 60 * 60 * 6; // 6 ساعات

function doPost(e) {
  var locked = false;
  var lock = LockService.getScriptLock();
  try {
    // بسيط للتحقق من المفتاح - خزّنه في Script Properties باسم API_KEY
    var API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (API_KEY) {
      var provided = (e.parameter && e.parameter.apiKey) ? e.parameter.apiKey : '';
      if (provided !== API_KEY) {
        return createErrorOutput('Unauthorized: invalid apiKey', 401);
      }
    }

    // محاولة الحصول على القفل (10 ثواني)
    locked = lock.tryLock(10000);
    if (!locked) {
      // لا نأخذ القفل — أرجع رسالة تطلب من العميل إعادة المحاولة لاحقاً
      return createJson({ result: 'retry', message: 'Server busy, please retry after a short delay.' });
    }

    var action = e.parameter && e.parameter.action;

    // Route visitor actions without opening the sheet here (they open and inspect sheet themselves)
    if (action === 'visitorIncrement' || action === 'visitorGet') {
      return handleVisitorAction(e);
    }

    // For register/updateScore we need the sheet
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);

    if (action == "register") {
      return registerUser(e, sheet);
    } else if (action == "updateScore") {
      return updateScore(e, sheet);
    } else {
      throw new Error("Action not specified or invalid.");
    }
  } catch (error) {
    return createErrorOutput(error.toString());
  } finally {
    if (locked) {
      try {
        lock.releaseLock();
      } catch (err) {
        // تجاهل خطأ تحرير القفل لكنه غير محتمل هنا
      }
    }
  }
}

// مساعدة: صياغة استجابة JSON
function createJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function createErrorOutput(message, code) {
  return createJson({ result: 'error', message: message, code: code || 400 });
}

// دالة لتسجيل مستخدم جديد مع تحديث الكاش
function registerUser(e, sheet) {
  var name = e.parameter.name || '';
  var phone = e.parameter.phone || '';
  var year = e.parameter.year || '';
  var uniqueId = Utilities.getUuid();
  var timestamp = new Date();

  // Append row بطريقة بسيطة داخل القفل
  sheet.appendRow([timestamp, name, phone, year, '', uniqueId]);

  // احصل على رقم الصف الأخير وخزّنه في الكاش
  var lastRow = sheet.getLastRow();
  try {
    CacheService.getScriptCache().put(CACHE_PREFIX + uniqueId, String(lastRow), CACHE_TTL);
  } catch (e) {
    // عدم القدرة على الكاش ليس مشكلة حرجة، نستمر بدون فشل
  }

  // مزامنة عدّ "المسجلين" في Script Properties كنسخة احتياطية
  try {
    var lr = sheet.getLastRow();
    var registered = 0;
    if (lr >= 2) {
      var ids = sheet.getRange(2, COLS.UNIQUE_ID, lr - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] && String(ids[i][0]).trim() !== '') registered++;
      }
    }
    PropertiesService.getScriptProperties().setProperty('visitor_count', String(registered));
  } catch (pe) {
    // ignore property sync errors
  }

  return createJson({ result: 'success', uniqueId: uniqueId, row: lastRow });
}

// دالة لتحديث النتيجة باستخدام الكاش كأسرع مسار ثم fallback للبحث
function updateScore(e, sheet) {
  var uniqueId = e.parameter.uniqueId;
  var score = e.parameter.score;

  if (!uniqueId) {
    return createErrorOutput("Unique ID is required to update score.");
  }

  var cache = CacheService.getScriptCache();
  var targetRow = -1;

  // محاولة الحصول على الصف من الكاش
  try {
    var cached = cache.get(CACHE_PREFIX + uniqueId);
    if (cached) {
      var r = parseInt(cached, 10);
      if (!isNaN(r) && r > 1) {
        // تأكد أن الـ uniqueId في ذلك الصف فعلاً مطابق (لتجنّب الـstale cache)
        var val = sheet.getRange(r, COLS.UNIQUE_ID).getValue();
        if (val == uniqueId) {
          targetRow = r;
        } else {
          // إن كان مختلفًا، أزل الكاش لتحفيز إعادة البحث
          cache.remove(CACHE_PREFIX + uniqueId);
        }
      }
    }
  } catch (err) {
    // تجاهل أخطاء الكاش، سنقوم بالبحث الكامل
  }

  // fallback: مسح العمود للعثور على الإجابة (إذا لم يجدها الكاش)
  if (targetRow == -1) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createErrorOutput("No users in sheet.");
    }
    var idColumnValues = sheet.getRange(2, COLS.UNIQUE_ID, lastRow - 1, 1).getValues();
    for (var i = 0; i < idColumnValues.length; i++) {
      if (idColumnValues[i][0] == uniqueId) {
        targetRow = i + 2;
        try {
          cache.put(CACHE_PREFIX + uniqueId, String(targetRow), CACHE_TTL);
        } catch (err) {}
        break;
      }
    }
  }

  if (targetRow != -1) {
    sheet.getRange(targetRow, COLS.SCORE).setValue(score);
    return createJson({ result: 'success', message: 'Score updated.', row: targetRow });
  } else {
    return createErrorOutput("User with the specified Unique ID was not found.", 404);
  }
}
// Handle visitor counter actions (increment / get)
function handleVisitorAction(e) {
  const action = (e.parameter && e.parameter.action) || (e.postData && tryParse(e.postData.contents).action) || '';

  // The visitor counter is based on the number of registered users in the sheet.
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found');
    var lr = sheet.getLastRow();
    var registeredCount = 0;
    if (lr >= 2) {
      var ids = sheet.getRange(2, COLS.UNIQUE_ID, lr - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] && String(ids[i][0]).trim() !== '') registeredCount++;
      }
    }
    // keep Script Properties in sync (best-effort)
    try { PropertiesService.getScriptProperties().setProperty('visitor_count', String(registeredCount)); } catch(e) {}
    return jsonResponse({ result: 'success', count: registeredCount });
  } catch (err) {
    // Fallback: return property-stored value if sheet access fails
    const props = PropertiesService.getScriptProperties();
    let count = Number(props.getProperty('visitor_count') || 0);
    return jsonResponse({ result: 'success', count: count });
  }
}

function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tryParse(s) {
  try { return JSON.parse(s); } catch(e) { return {}; }
}