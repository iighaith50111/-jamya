# دفتري (Jamya) — إدارة الجمعيات المالية

تطبيق Next.js (App Router) لإدارة الجمعيات المالية الدورية (ROSCA)، بواجهة عربية RTL كاملة،
مبني بـ Tailwind CSS وأيقونات Lucide.

## التشغيل محلياً

```bash
npm install
npm run dev
```

افتح http://localhost:3000

## البنية

```
app/
  layout.jsx      # إعداد RTL + خطوط Cairo/Tajawal عبر next/font/google
  page.jsx         # نقطة الدخول، يعرض <JamyaApp />
  globals.css      # Tailwind + أنماط أساسية (الأختام، الأرقام الجدولية، الطباعة)
components/
  JamyaApp.jsx     # كامل منطق وواجهة التطبيق (لوحة تحكم، جمعيات، مشتركين، سجل حسابي، أدوار، تقارير)
```

## تخزين البيانات

البيانات محفوظة حالياً في `localStorage` الخاص بالمتصفح (كل جهاز يحتفظ ببياناته بشكل منفصل).
منطق التخزين معزول بالكامل في أعلى ملف `components/JamyaApp.jsx` ضمن الدالتين
`loadAssociations()` و `saveAssociations()` — يمكنك استبدالهما بسهولة بطلبات API متصلة
بقاعدة بيانات حقيقية (Supabase أو SQLite عبر route handlers في `app/api/`) دون تعديل باقي الواجهة.

## النشر على Vercel

1. ارفع هذا المجلد كمستودع Git (GitHub/GitLab/Bitbucket).
2. من [vercel.com/new](https://vercel.com/new) اختر المستودع واضغط Deploy — لا حاجة لأي إعدادات إضافية،
   Next.js يُكتشف تلقائياً.
3. (اختياري) إذا ربطت قاعدة بيانات لاحقاً، أضف متغيرات البيئة اللازمة من إعدادات المشروع في Vercel.

## البناء للإنتاج

```bash
npm run build
npm start
```
