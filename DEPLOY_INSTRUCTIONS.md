# 🛠️ MO3SKER — تعليمات النشر وإصلاح خطأ 404

## الملفات المُصلَحة في هذه الحزمة

| الملف | الإصلاح |
|-------|---------|
| `manifest.json` | تم تغيير `start_url` إلى `./index.html` و`scope` إلى `./` |
| `sw.js` | تم إضافة SPA fallback كامل + تحسين caching |
| `index.html` | تم تحويل جميع المسارات إلى relative paths (`./`) |
| `script.js` | تم إضافة SPA redirect handler + تحديد `scope` عند تسجيل SW |
| `404.html` | **ملف جديد** — يعيد التوجيه تلقائياً إلى index.html |

---

## خطوات النشر على GitHub Pages

1. **استبدل** الملفات القديمة بالملفات الجديدة من هذه الحزمة
2. **أضف** ملف `404.html` إلى جذر المشروع
3. **تأكد** من أن جميع الملفات في الجذر (root) مباشرةً وليس داخل مجلد فرعي

### إذا كان المشروع في مجلد فرعي (مثل `/mo3sker/`)
عدّل في `manifest.json`:
```json
"start_url": "/mo3sker/index.html",
"scope": "/mo3sker/"
```
وعدّل في `sw.js` في مصفوفة `ASSETS_TO_CACHE`:
```js
'/mo3sker/index.html',
'/mo3sker/style.css',
// إلخ...
```

---

## سبب المشكلة الأصلية

كانت المشكلة من **ثلاثة أسباب مجتمعة**:

1. **`manifest.json`**: `start_url: "/"` — عند تثبيت التطبيق على GitHub Pages، الـ `/` لا يشير إلى `index.html` بل إلى root الـ domain مما يسبب 404
2. **Service Worker**: لم يكن هناك fallback حقيقي لإعادة `index.html` عند طلبات navigation
3. **غياب `404.html`**: على GitHub Pages، أي صفحة غير موجودة تُعيد 404 بدلاً من index.html
