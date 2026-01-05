# דוח מיפוי מערכת - מערכת מבחן SPSS

**תאריך:** 2025-01-27  
**מטרה:** מיפוי מלא של האפליקציה, זיהוי בעיות, ותכנית שדרוג

---

## 1. מה יש פה? (Stack + מבנה תיקיות)

### 1.1 טכנולוגיות

**Frontend:**
- **React** 19.1.0 (TypeScript)
- **Vite** 6.3.5 (Build tool)
- **TypeScript** 5.7.2
- **Tailwind CSS** (via CDN)
- **SheetJS (XLSX)** 0.18.5 (via CDN) - ליצירת קבצי Excel

**פריסה:**
- **Firebase Hosting** (פרויקט: `spss-exam-generator`)
- **Build output:** `dist/` directory

**אחסון נתונים:**
- **localStorage** בלבד (אין Database!)
- אין Backend/API
- אין Firebase Firestore/Realtime DB

### 1.2 מבנה תיקיות

```
exam_spss/
├── App.tsx                    # קומפוננטה ראשית, ניהול state
├── index.tsx                  # Entry point
├── index.html                 # HTML template (טוען Tailwind + XLSX מ-CDN)
├── types.ts                   # TypeScript interfaces
├── constants.ts               # מאגר שאלות מובנה (30 MCQ + 5 פתוחות)
├── components/
│   ├── Header.tsx             # כותרת האפליקציה
│   ├── InstructorView.tsx     # ממשק מרצה (התחברות, הגדרות, יצירת שאלון)
│   └── StudentView.tsx        # ממשק סטודנט (עונה, מוריד Excel)
├── dist/                      # Build output (מוכן לפריסה)
├── firebase.json              # הגדרות Firebase Hosting
├── .firebaserc                # פרויקט Firebase: "spss-exam-generator"
├── vite.config.ts             # הגדרות Vite
├── package.json               # תלויות
└── .env.local                 # משתנה: GEMINI_API_KEY (לא בשימוש!)

```

### 1.3 ראיות מהקבצים

**package.json:**
```json
{
  "name": "spss-exam-generator",
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  }
}
```

**.firebaserc:**
```json
{
  "projects": {
    "default": "spss-exam-generator"
  }
}
```

---

## 2. איפה הפריסה ואיפה ה-DB?

### 2.1 פריסה

**שרת:** Firebase Hosting  
**פרויקט:** `spss-exam-generator`  
**URL משוער:** `https://spss-exam-generator.web.app` או `https://spss-exam-generator.firebaseapp.com`

**ראיות:**
- קובץ `firebase.json` מגדיר hosting עם `public: "dist"`
- קובץ `.firebaserc` מגדיר פרויקט `spss-exam-generator`
- אין קבצי פריסה אחרים (אין `vercel.json`, `netlify.toml`, `render.yaml`, `Procfile`)

**איך לפרוס:**
```bash
npm run build          # בונה ל-dist/
firebase deploy         # מפריס ל-Firebase Hosting
```

### 2.2 Database

**אין Database!** כל הנתונים נשמרים ב-**localStorage** של הדפדפן.

**מה נשמר ב-localStorage:**
1. `isLoggedIn` - סטטוס התחברות מרצה
2. `examPassword` - סיסמת מרצה (ברירת מחדל: "1234")
3. `examConfig` - הגדרות מבחן (מספר שאלות, אחוזי קושי)
4. `addedQuestions` - שאלות שהוספו על ידי מרצה

**ראיות מהקוד:**

```19:28:App.tsx
const [questionBank, setQuestionBank] = useState<QuestionBank>(() => {
    const added = localStorage.getItem('addedQuestions');
    if (added) {
        const addedBank: QuestionBank = JSON.parse(added);
        return {
            questions: [...FULL_QUESTION_BANK.questions, ...addedBank.questions],
            openEndedQuestions: [...FULL_QUESTION_BANK.openEndedQuestions, ...addedBank.openEndedQuestions],
        };
    }
    return FULL_QUESTION_BANK;
});
```

```56:65:App.tsx
const handleLogin = (password: string) => {
    const storedPassword = localStorage.getItem('examPassword') || '1234';
    if (password === storedPassword) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('סיסמה שגויה. נסה שוב.');
    }
  };
```

**בעיות:**
- ❌ אין שמירת תשובות סטודנטים (רק הורדת Excel מקומית)
- ❌ אין סנכרון בין מכשירים
- ❌ נתונים נמחקים אם מנקים את הדפדפן
- ❌ אין גיבוי

---

## 3. איך זה אמור לעבוד? (זרימה מלאה)

### 3.1 דיאגרמת זרימה

```
┌─────────────────────────────────────────────────────────────┐
│                    מרצה (Instructor)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 1. התחברות (סיסמה)    │
         │    localStorage        │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 2. הוספת שאלות        │
         │    localStorage        │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 3. הגדרת מבחן         │
         │    (מספר שאלות, קושי) │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 4. יצירת שאלון         │
         │    אלגוריתם client-side│
         │    (הגרלה לפי קושי)    │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  סטודנט (Student)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 5. עונה על שאלות     │
         │    State בלבד         │
         │    (לא נשמר!)         │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 6. הגשה               │
         │    חישוב ציונים        │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 7. הורדת Excel        │
         │    XLSX (CDN)          │
         │    קובץ מקומי בלבד     │
         └───────────────────────┘
```

### 3.2 זרימה מפורטת

#### שלב 1: מרצה מתחבר
- מרצה מזין סיסמה (ברירת מחדל: "1234")
- הסיסמה נבדקת מול `localStorage.getItem('examPassword')`
- אם נכון → `isLoggedIn = true`

#### שלב 2: מרצה מוסיף שאלות (אופציונלי)
- מרצה יכול להוסיף שאלות חדשות (MCQ או פתוחות)
- השאלות נשמרות ב-`localStorage.setItem('addedQuestions', ...)`
- השאלות מתווספות למאגר הקבוע (`constants.ts`)

#### שלב 3: מרצה מגדיר מבחן
- מספר שאלות כולל
- מספר שאלות רב-ברירה
- מספר שאלות פתוחות
- אחוזי קושי (קל/בינוני/קשה)

#### שלב 4: יצירת שאלון
**אלגוריתם (ב-`handleGenerateExam`):**
1. קטלוג שאלות לפי רמת Bloom:
   - קל: `Remember`, `Understand`
   - בינוני: `Apply`, `Analyze`
   - קשה: `Evaluate`, `Create`
2. חישוב מספר שאלות לכל רמה
3. הגרלה אקראית מתוך כל קטגוריה
4. ערבוב סופי של כל השאלות
5. ערבוב אפשרויות תשובה (MCQ)

#### שלב 5: סטודנט עונה
- סטודנט רואה את השאלון
- עונה על שאלות (MCQ: בחירה אחת, פתוחות: טקסט)
- התשובות נשמרות ב-state בלבד (`useState`)
- **לא נשמרות בשום מקום!**

#### שלב 6: הגשה והורדת Excel
- סטודנט מזין שם ות.ז.
- לחיצה על "הגש" → חישוב ציונים
- יצירת קובץ Excel עם:
  - פרטי סטודנט
  - כל השאלות והתשובות
  - תשובות נכונות (MCQ)
  - סטטוס נכון/טועה
  - ציון (אחוז)
- הורדה מקומית בלבד (`XLSX.writeFile`)

---

## 4. למה זה לא עובד? (ממצאים + Root Cause)

### 4.1 בעיות עיקריות

#### בעיה #1: אין Database
**Root Cause:** כל הנתונים ב-localStorage  
**תוצאה:**
- תשובות סטודנטים לא נשמרות
- אין יכולת לראות תוצאות מרכזיות
- אין גיבוי
- נתונים נמחקים אם מנקים את הדפדפן

#### בעיה #2: אין Backend/API
**Root Cause:** הכל client-side  
**תוצאה:**
- אין validation בצד השרת
- אין אבטחה אמיתית (סיסמה ב-localStorage!)
- אין יכולת לסנכרן בין מכשירים
- אין לוגים/מעקב

#### בעיה #3: תלויות חיצוניות (CDN)
**Root Cause:** Tailwind CSS ו-XLSX נטענים מ-CDN  
**תוצאה:**
- אם CDN לא זמין → האפליקציה לא עובדת
- אין offline support
- תלויות חיצוניות לא יציבות

#### בעיה #4: באג בקוד
**מיקום:** `components/InstructorView.tsx:109`

```109:109:components/InstructorView.tsx
if (newQuestion.type === 'רב ברירה') {
```

**הבעיה:** הערך ב-select הוא `'mcq'` אבל הבדיקה היא `'רב ברירה'`

```232:234:components/InstructorView.tsx
<select value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})} className="w-full p-2 border rounded-md bg-white text-gray-800">
    <option value="mcq">רב ברירה</option>
    <option value="open">פתוחה</option>
</select>
```

**תוצאה:** הוספת שאלות MCQ לא עובדת!

#### בעיה #5: משתנה סביבה לא בשימוש
**מיקום:** `.env.local`  
**תוכן:** `GEMINI_API_KEY=PLACEHOLDER_API_KEY`  
**בעיה:** המשתנה לא בשימוש באפליקציה (כנראה שריד מפרויקט אחר)

### 4.2 סיכום Root Causes

| בעיה | חומרה | השפעה |
|------|--------|--------|
| אין DB | 🔴 קריטי | תשובות לא נשמרות |
| אין Backend | 🔴 קריטי | אין אבטחה, אין validation |
| CDN dependencies | 🟡 בינוני | תלות ברשת חיצונית |
| באג הוספת שאלות | 🔴 קריטי | פונקציונליות שבורה |
| GEMINI_API_KEY לא בשימוש | 🟢 נמוך | לא משפיע |

---

## 5. איך מחזירים לחיים? (צעדים)

### 5.1 תיקון מינימלי (MVP Revive)

#### שלב 1: תיקון באג הוספת שאלות
**קובץ:** `components/InstructorView.tsx`  
**שינוי:** שורה 109

```typescript
// לפני:
if (newQuestion.type === 'רב ברירה') {

// אחרי:
if (newQuestion.type === 'mcq') {
```

#### שלב 2: הרצה מקומית
```bash
# 1. התקנת תלויות
npm install

# 2. הרצה בפיתוח
npm run dev

# 3. Build לפריסה
npm run build
```

#### שלב 3: פריסה ל-Firebase
```bash
# התחברות ל-Firebase (אם לא מחובר)
firebase login

# פריסה
firebase deploy
```

**הערה:** האפליקציה תעבוד, אבל עדיין ללא DB וללא שמירת תשובות.

### 5.2 בדיקות בסיסיות

1. ✅ התחברות מרצה (סיסמה: 1234)
2. ✅ הוספת שאלה חדשה (לאחר תיקון הבאג)
3. ✅ יצירת שאלון
4. ✅ סטודנט עונה ומגיש
5. ✅ הורדת קובץ Excel

---

## 6. איך משדרגים? (2 מסלולים)

### מסלול A: מהיר (Minimum Viable Fix)

**מטרה:** להחזיר עובד תוך מינימום שינוי

**צעדים:**
1. ✅ תיקון באג הוספת שאלות (5 דקות)
2. ✅ הסרת GEMINI_API_KEY (1 דקה)
3. ✅ פריסה ל-Firebase (5 דקות)

**סיכון:** נמוך  
**זמן:** ~15 דקות  
**תוצאה:** אפליקציה עובדת, אבל עדיין ללא DB

---

### מסלול B: בריא לטווח ארוך (Production Ready)

**מטרה:** ארכיטקטורה מודרנית + אבטחה + DB + לוגים

#### שלב 1: הוספת Firebase Firestore
**זמן:** 2-3 שעות

**שינויים:**
- התקנת `firebase` SDK
- יצירת `firebaseConfig.ts`
- החלפת localStorage ב-Firestore:
  - `addedQuestions` → Collection `questions`
  - `examConfig` → Document `config`
  - תשובות סטודנטים → Collection `submissions`

**קבצים חדשים:**
- `src/firebase/config.ts`
- `src/services/questionService.ts`
- `src/services/submissionService.ts`

**קבצים לשינוי:**
- `App.tsx` - החלפת localStorage ב-Firestore hooks
- `components/InstructorView.tsx` - שמירה ל-Firestore
- `components/StudentView.tsx` - שמירת תשובות ל-Firestore

#### שלב 2: אבטחה
**זמן:** 1-2 שעות

**שינויים:**
- Firebase Authentication (Email/Password)
- Firestore Security Rules:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /questions/{questionId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      match /submissions/{submissionId} {
        allow read: if request.auth != null;
        allow create: if true; // סטודנטים יכולים להגיש
      }
    }
  }
  ```

#### שלב 3: ניהול שאלות/גרסאות
**זמן:** 2-3 שעות

**תכונות:**
- CRUD מלא לשאלות
- גרסאות שאלונים (שמירת שאלונים שנוצרו)
- היסטוריית שינויים

#### שלב 4: יצוא תוצאות יציב
**זמן:** 1-2 שעות

**שינויים:**
- Firebase Functions ליצירת Excel בשרת
- או: שימוש ב-`xlsx` package (לא CDN)
- דשבורד מרצה: צפייה בכל התשובות

#### שלב 5: לוגים וניטור
**זמן:** 1 שעה

**שינויים:**
- Firebase Analytics
- Error logging (Firebase Crashlytics)
- Console logs מובנים

#### שלב 6: שיפורי UX
**זמן:** 2-3 שעות

**שינויים:**
- Loading states
- Error handling
- Toast notifications
- Responsive design improvements

---

### סיכום מסלול B

| שלב | זמן | סיכון | עדיפות |
|-----|-----|--------|---------|
| Firestore | 2-3h | בינוני | 🔴 גבוה |
| אבטחה | 1-2h | נמוך | 🔴 גבוה |
| ניהול שאלות | 2-3h | נמוך | 🟡 בינוני |
| יצוא תוצאות | 1-2h | נמוך | 🟡 בינוני |
| לוגים | 1h | נמוך | 🟢 נמוך |
| UX | 2-3h | נמוך | 🟢 נמוך |

**סה"כ זמן:** 9-14 שעות  
**סיכון כולל:** בינוני-נמוך  
**תוצאה:** אפליקציה production-ready עם DB, אבטחה, ולוגים

---

## 7. קבצים לשינוי (מסלול B)

### קבצים חדשים:
```
src/
├── firebase/
│   ├── config.ts              # Firebase initialization
│   └── rules.json              # Firestore security rules
├── services/
│   ├── questionService.ts      # CRUD שאלות
│   ├── submissionService.ts    # שמירת תשובות
│   └── examService.ts          # יצירת שאלונים
├── hooks/
│   ├── useQuestions.ts         # Firestore hook לשאלות
│   └── useSubmissions.ts       # Firestore hook לתשובות
└── utils/
    └── excelExport.ts          # יצירת Excel (לא CDN)
```

### קבצים לשינוי:
- `App.tsx` - החלפת localStorage ב-Firestore
- `components/InstructorView.tsx` - שמירה ל-Firestore
- `components/StudentView.tsx` - שמירת תשובות + Firestore
- `package.json` - הוספת `firebase`, `xlsx`
- `index.html` - הסרת CDN scripts, הוספת Firebase SDK

---

## 8. סדר עבודה מומלץ (מסלול B)

1. **יום 1:** Firestore setup + החלפת localStorage
2. **יום 2:** אבטחה + Security Rules
3. **יום 3:** ניהול שאלות + CRUD
4. **יום 4:** יצוא תוצאות + דשבורד מרצה
5. **יום 5:** לוגים + UX improvements + בדיקות

---

## 9. מה בודקים בסוף?

### בדיקות פונקציונליות:
- [ ] מרצה מתחבר (Firebase Auth)
- [ ] מרצה מוסיף שאלות (נשמר ב-Firestore)
- [ ] מרצה יוצר שאלון
- [ ] סטודנט עונה ומגיש (נשמר ב-Firestore)
- [ ] מרצה רואה את כל התשובות
- [ ] יצוא Excel עובד

### בדיקות אבטחה:
- [ ] רק מרצה יכול להוסיף שאלות
- [ ] סטודנטים יכולים להגיש תשובות
- [ ] Security Rules מונעות גישה לא מורשית

### בדיקות ביצועים:
- [ ] טעינה מהירה (< 2 שניות)
- [ ] אין שגיאות בקונסול
- [ ] Responsive על מובייל

---

## 10. מסקנות

### מה עובד כרגע:
- ✅ Build עובד
- ✅ UI בסיסי עובד
- ✅ אלגוריתם יצירת שאלון עובד
- ✅ יצירת Excel עובדת (CDN)

### מה לא עובד:
- ❌ הוספת שאלות MCQ (באג)
- ❌ שמירת תשובות סטודנטים
- ❌ גישה מרכזית לתוצאות
- ❌ אבטחה אמיתית

### המלצה:
**מסלול A** אם צריך פתרון מהיר (15 דקות).  
**מסלול B** אם רוצים פתרון יציב לטווח ארוך (9-14 שעות).

---

**סיום דוח**

