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

  // no visitor endpoints here anymore

    // For register/updateScore we need the sheet
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);

    if (action == "register") {
      return registerUser(e, sheet);
    } else if (action == "updateScore") {
      // تم تعطيل تحديث النقاط بطلبك. نعيد رسالة ثابتة ولا نلمس الشيت.
      return createJson({ result: 'ignored', message: 'Score updating disabled server-side.' });
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

  // (أزيل منطق عدّ الزوار بناءً على طلبك)

  return createJson({ result: 'success', uniqueId: uniqueId, row: lastRow });
}

// ملاحظة: منطق updateScore أزيل بناء على طلب المستخدم (النقاط محليّة فقط الآن)
// تبسيط doGet ليكون فحص صحة فقط (Health Check)
function doGet(e) {
  return createJson({ result: 'ok', ts: Date.now(), note: 'Visitor counter removed.' });
}
