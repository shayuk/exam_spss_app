# דוח מיפוי Pre-Flight - שדרוג אפליקציית מבחן SPSS

**תאריך:** 2025-01-27  
**מטרה:** מיפוי המצב הנוכחי לפני תחילת שדרוג לפי Milestones

---

## 1. סכימת Database (Supabase) - מה קיים בפועל

**⚠️ הערה חשובה:** דוח זה עודכן לאחר DB Reality Check. כל הטבלאות קיימות ב-Supabase, אך יש לאמת את העמודות בפועל.

### משתני סביבה (Environment Variables)

**מיקום בקוד:** `src/lib/supabaseClient.ts:3-4`
- `VITE_SUPABASE_URL` - נטען מ-`.env.local` או מ-Vercel env vars
- `VITE_SUPABASE_ANON_KEY` - נטען מ-`.env.local` או מ-Vercel env vars

**קבצים רלוונטיים:**
- `.env.local` (local development)
- Vercel Environment Variables (production)

### טבלאות קיימות (מאומתות):

#### `question_bank` ✅
**סטטוס:** קיימת ופועלת  
**מיקום בקוד:** `src/services/questionsRepo.ts` - `DBQuestionRow` interface

**עמודות ידועות (מהקוד):**
```sql
- id: string (PK)
- created_by: string (FK → auth.users)
- type: 'mcq' | 'open'
- topic: string | null
- difficulty: number (1-5)
- bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
- question_text: string
- choices: jsonb | null (array of strings for MCQ)
- correct_answer: string | null (text answer for MCQ)
- explanation: string | null
- created_at: timestamp
- updated_at: timestamp
```

**⚠️ צריך לאמת:** האם יש עמודות נוספות שלא מופיעות בקוד?

#### `profiles` ✅
**סטטוס:** קיימת  
**מיקום בקוד:** `components/InstructorView.tsx:97` - בדיקת role

**עמודות ידועות (מהקוד):**
```sql
- id: string (PK, FK → auth.users)
- role: string | null
```

**⚠️ צריך לאמת:** האם יש עמודות נוספות?

#### `exams` ✅
**סטטוס:** קיימת ב-DB (מאומת על ידי המשתמש)  
**מיקום בקוד:** אין שימוש עדיין

**עמודות משוערות (צריך לאמת בפועל):**
```sql
- id: uuid (PK)
- created_by: uuid (FK → auth.users)
- title: string | null
- type: string | null
- difficulty: number | null
- topic: string | null
- num_questions: integer
- mix: jsonb | null (config object)
- created_at: timestamp
- updated_at: timestamp
- status: 'draft' | 'active' | 'completed'
```

**⚠️ צריך לאמת:** עמודות בפועל יאומתו על ידי DB Reality Check

#### `exam_items` ✅
**סטטוס:** קיימת ב-DB (מאומת על ידי המשתמש)  
**מיקום בקוד:** אין שימוש עדיין

**עמודות משוערות (צריך לאמת בפועל):**
```sql
- id: uuid (PK)
- exam_id: uuid (FK → exams)
- question_id: uuid (FK → question_bank)
- order_index: integer
- locked: boolean (default: false)
- replaced_from: uuid | null (FK → exam_items, אם הוחלפה)
- created_at: timestamp
```

**⚠️ צריך לאמת:** עמודות בפועל יאומתו על ידי DB Reality Check

#### `submissions` ✅
**סטטוס:** קיימת ב-DB (מאומת על ידי המשתמש)  
**מיקום בקוד:** אין שימוש עדיין

**עמודות משוערות (צריך לאמת בפועל):**
```sql
- id: uuid (PK)
- exam_id: uuid (FK → exams)
- student_id: string | null
- student_name: string | null
- answers: jsonb (array of {question_id, answer, points, comment})
- score: number | null
- total_score: number | null
- created_at: timestamp
- updated_at: timestamp
```

**⚠️ צריך לאמת:** עמודות בפועל יאומתו על ידי DB Reality Check

---

## 1.1 DB Reality Check - אימות סכימה בפועל

**סקריפט בדיקה:** `src/utils/dbRealityCheck.ts`

**איך להריץ:**
1. הפעל את האפליקציה במצב dev (`npm run dev`)
2. פתח את קונסול הדפדפן (F12)
3. הסקריפט ירוץ אוטומטית, או הרץ ידנית: `window.runDBRealityCheck()`

**מה הסקריפט בודק:**
- ✅ קיום כל טבלה: `question_bank`, `profiles`, `exams`, `exam_items`, `submissions`
- ✅ גישה לכל טבלה (RLS/Schema)
- ✅ שמות עמודות בפועל (Object.keys של הרשומה הראשונה)
- ✅ סוגי שגיאות: schema/table not found, RLS, network, auth

**תוצאות:**
- יודפס בקונסול: SUCCESS/FAIL לכל טבלה + שמות עמודות
- אם נכשל: סוג השגיאה + הודעת שגיאה מלאה (ללא מפתחות)

---

## 2. מיפוי קוד - איפה כל דבר נמצא

### 2.1 יצירת מבחנים (Exams)

**מיקום:** `App.tsx:250-316` - `handleGenerateExam`

**מה קורה כרגע:**
- מבחן נוצר רק בזיכרון (state: `generatedExam`)
- לא נשמר ב-DB
- אלגוריתם: קטלוג לפי Bloom level → הגרלה → ערבוב

**פילטרים נוכחיים:**
- `bloom_level` (Remember/Understand = קל, Apply/Analyze = בינוני, Evaluate/Create = קשה)
- `isOpen` (MCQ vs פתוחה)
- אחוזי קושי (`easyPercent`, `mediumPercent`, `hardPercent`)

**חסר:**
- שמירה ב-DB
- טבלת `exams`
- טבלת `exam_items`
- פילטרים נוספים (`type`, `difficulty`, `topic`, `mix`)

### 2.2 ניהול שאלות (Question Bank)

**מיקום:** `src/services/questionsRepo.ts`

**פונקציות קיימות:**
- `listQuestions()` - קריאה מ-`question_bank`
- `createQuestion()` - הוספה ל-`question_bank`
- `updateQuestion()` - עדכון ב-`question_bank`
- `deleteQuestion()` - מחיקה מ-`question_bank`

**מיקום UI:** `components/InstructorView.tsx:179-215` - `handleAddQuestion`

**מה עובד:**
- ✅ קריאת שאלות מ-Supabase
- ✅ הוספת שאלות חדשות
- ✅ עדכון/מחיקת שאלות

**חסר:**
- אין פילטרים מתקדמים (`type`, `difficulty`, `topic`)
- אין `mix` configuration

### 2.3 תשובות סטודנטים (Submissions)

**מיקום:** `components/StudentView.tsx:36-117` - `handleSubmit`

**מה קורה כרגע:**
- תשובות נשמרות רק ב-state (`answers`)
- בהגשה: חישוב ציון מקומי + הורדת Excel
- **לא נשמר ב-DB**

**חסר:**
- שמירה ב-DB (`submissions` table)
- ניקוד לשאלות פתוחות (`points`, `comment`)
- חישוב ציון סופי
- תמיכה ב-`answers` כ-jsonb עם points/comments

### 2.4 יצוא Excel

**מיקום:** `components/StudentView.tsx:86-114`

**מה קורה כרגע:**
- שימוש ב-XLSX מ-CDN (`index.html`)
- יצירת Excel מקומי בלבד
- פורמט: Sheet אחד עם כל הנתונים

**חסר:**
- יצוא למרצה (לא רק לסטודנט)
- Sheet Summary + Sheet Details
- תמיכה בניקוד/הערות לשאלות פתוחות
- ספרייה מקומית (לא CDN)

### 2.5 אימות והרשאות (Auth & Roles)

**מיקום:** 
- `src/lib/supabaseClient.ts` - Supabase client
- `components/SupabaseLoginCard.tsx` - UI התחברות
- `components/InstructorView.tsx:76-123` - בדיקת role

**מה קורה כרגע:**
- ✅ Supabase Auth עובד
- ✅ בדיקת role מ-`profiles.role`
- ✅ בדיקת session

**חסר:**
- אין הגדרה ברורה של `role='instructor'` vs `role='student'`
- אין RLS policies מפורשות

---

## 3. רשימת פערים (Gaps)

### 3.1 Database Schema

| טבלה | סטטוס | פערים |
|------|--------|-------|
| `question_bank` | ✅ קיימת | חסר: `image_data` (כרגע רק ב-state) - צריך לאמת עמודות בפועל |
| `profiles` | ✅ קיימת | חסר: הגדרה ברורה של roles - צריך לאמת עמודות בפועל |
| `exams` | ✅ קיימת | צריך לאמת עמודות בפועל + לוודא התאמה לקוד |
| `exam_items` | ✅ קיימת | צריך לאמת עמודות בפועל (`locked`, `replaced_from`, `order_index`) |
| `submissions` | ✅ קיימת | צריך לאמת עמודות בפועל (`answers` jsonb, `score`, `total_score`) |

**⚠️ הערה:** כל הטבלאות קיימות, אך יש להריץ DB Reality Check כדי לאמת את העמודות בפועל לפני M1.

### 3.2 פונקציונליות

| תכונה | סטטוס | פערים |
|-------|--------|-------|
| יצירת מבחן | ⚠️ חלקי | נוצר רק בזיכרון, לא נשמר ב-DB |
| שמירת מבחן | ❌ חסר | אין שמירה ב-DB |
| עריכת מבחן בזמן אמת | ❌ חסר | אין Replace/Delete/Lock |
| ניקוד שאלות פתוחות | ❌ חסר | אין UI/DB לניקוד |
| שמירת תשובות | ❌ חסר | רק Excel מקומי |
| יצוא Excel למרצה | ❌ חסר | רק לסטודנט |
| Exam Mode | ❌ חסר | אין מסך נקי לשיתוף |
| Generate Draft Questions | ❌ חסר | אין מחולל טיוטות |

### 3.3 UI Components

| קומפוננטה | סטטוס | פערים |
|-----------|--------|-------|
| InstructorView | ✅ קיים | חסר: Replace/Delete/Lock, Exam Mode, Generate Draft |
| StudentView | ✅ קיים | חסר: שמירה ב-DB |
| SupabaseLoginCard | ✅ קיים | אין פערים |

---

## 4. מיפוי קבצים ופונקציות

### 4.1 קבצים עיקריים

```
App.tsx
├── handleGenerateExam()          # יצירת מבחן (זיכרון בלבד)
├── handleAddQuestion()           # הוספת שאלה (→ Supabase)
└── handleConfigChange()          # עדכון הגדרות (localStorage)

components/InstructorView.tsx
├── handleAddQuestion()           # UI הוספת שאלה
├── checkConnection()             # בדיקת session/role
└── handleGenerateExam()          # כפתור יצירת מבחן

components/StudentView.tsx
├── handleSubmit()                # הגשה + Excel (לא נשמר ב-DB)
└── handleAnswerChange()           # עדכון תשובות (state בלבד)

src/services/questionsRepo.ts
├── listQuestions()                # קריאה מ-question_bank
├── createQuestion()               # הוספה ל-question_bank
├── updateQuestion()               # עדכון ב-question_bank
└── deleteQuestion()               # מחיקה מ-question_bank

src/lib/supabaseClient.ts
└── supabase                       # Supabase client instance
```

### 4.2 קבצים חדשים נדרשים

```
src/services/
├── examsRepo.ts                   # CRUD exams + exam_items
└── submissionsRepo.ts             # CRUD submissions

components/
├── ExamModeView.tsx               # מסך Exam Mode נקי
├── QuestionDraftGenerator.tsx     # מחולל טיוטות
└── SubmissionReview.tsx           # ביקורת תשובות + ניקוד

utils/
└── excelExport.ts                 # יצוא Excel (לא CDN)
```

---

## 5. הנחות לגבי סכימת DB

### 5.1 `question_bank` (קיים)
- ✅ `type`: 'mcq' | 'open'
- ✅ `difficulty`: 1-5
- ✅ `bloom_level`: 6 רמות
- ⚠️ `topic`: קיים אבל לא בשימוש בקוד
- ❌ `image_data`: לא קיים ב-DB (רק ב-state)

### 5.2 `exams` (לא קיים - נדרש)
- `type`: string | null (סוג מבחן)
- `difficulty`: number | null (רמת קושי כללית)
- `topic`: string | null (נושא)
- `num_questions`: integer
- `mix`: jsonb | null (config object: {mcq: 10, open: 1, easyPercent: 10, ...})

### 5.3 `exam_items` (לא קיים - נדרש)
- `order_index`: integer (סדר השאלות)
- `locked`: boolean (נעול לעריכה)
- `replaced_from`: uuid | null (אם הוחלפה שאלה)

### 5.4 `submissions` (לא קיים - נדרש)
- `answers`: jsonb (array of objects):
  ```typescript
  {
    question_id: string,
    answer: string,
    points: number | null,      // לשאלות פתוחות
    comment: string | null,      // הערות מרצה
    is_correct: boolean | null  // לשאלות MCQ
  }[]
  ```
- `score`: number | null (ציון סופי)
- `total_score`: number | null (ציון מקסימלי)

---

## 6. סיכום פערים לפי Milestones

### M1 - Replace/Delete/Lock בשאלון
**פערים:**
- ✅ טבלת `exams` קיימת - צריך לאמת עמודות
- ✅ טבלת `exam_items` קיימת - צריך לאמת עמודות (`locked`, `replaced_from`, `order_index`)
- ⚠️ צריך לאמת: האם העמודות `locked`, `replaced_from`, `order_index` קיימות בפועל
- ❌ אין UI: Replace/Delete/Lock buttons
- ❌ אין לוגיקה: מניעת כפילויות, פילטרים
- ❌ אין קוד: CRUD operations ל-`exams` ו-`exam_items`

### M2 - ניקוד/הערות + חישוב ציון
**פערים:**
- ✅ טבלת `submissions` קיימת - צריך לאמת עמודות
- ⚠️ צריך לאמת: האם יש שדות `points`, `comment` ב-`answers` jsonb
- ❌ אין UI: ניקוד לשאלות פתוחות
- ❌ אין חישוב ציון סופי
- ❌ אין קוד: CRUD operations ל-`submissions`

### M3 - Export Excel מקצועי
**פערים:**
- ❌ אין יצוא למרצה (רק לסטודנט)
- ❌ אין Sheet Summary + Details
- ❌ תלויות ב-CDN (צריך ספרייה מקומית)

### M4 - Exam Mode
**פערים:**
- ❌ אין קומפוננטה `ExamModeView`
- ❌ אין UI נקי לשיתוף בזום
- ❌ אין אפשרות להסתיר טאבים

### M5 - Generate Draft Questions
**פערים:**
- ❌ אין מחולל טיוטות
- ❌ אין מסך Review
- ❌ אין שמירת טיוטות

---

## 7. תוכנית SQL Migrations (מוצע)

### Migration 1: יצירת טבלאות exams + exam_items
```sql
-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  title TEXT,
  type TEXT,
  difficulty INTEGER,
  topic TEXT,
  num_questions INTEGER NOT NULL,
  mix JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_items table
CREATE TABLE IF NOT EXISTS exam_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES question_bank(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  locked BOOLEAN DEFAULT FALSE,
  replaced_from UUID REFERENCES exam_items(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, order_index)
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT,
  student_name TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC(5,2),
  total_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_items_exam_id ON exam_items(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_items_question_id ON exam_items(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON submissions(exam_id);
```

### Migration 2: RLS Policies (אם נדרש)
```sql
-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies (דוגמה - צריך להתאים לדרישות)
CREATE POLICY "Instructors can manage exams"
  ON exams FOR ALL
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view exam_items"
  ON exam_items FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage exam_items"
  ON exam_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_items.exam_id
      AND exams.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Instructors can view submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = submissions.exam_id
      AND exams.created_by = auth.uid()
    )
  );
```

---

## 8. נקודות בדיקה ידניות (Pre-Milestone)

### בדיקות בסיסיות:
- [ ] התחברות Supabase עובדת
- [ ] קריאת שאלות מ-`question_bank` עובדת
- [ ] הוספת שאלה חדשה עובדת
- [ ] יצירת מבחן בזיכרון עובדת
- [ ] הגשת תשובות + Excel עובדת

### בדיקות DB:
- [x] טבלת `question_bank` קיימת ופועלת (מאומת)
- [x] טבלת `profiles` קיימת ופועלת (מאומת)
- [x] טבלת `exams` קיימת (מאומת על ידי המשתמש)
- [x] טבלת `exam_items` קיימת (מאומת על ידי המשתמש)
- [x] טבלת `submissions` קיימת (מאומת על ידי המשתמש)
- [ ] **DB Reality Check:** הרצת `window.runDBRealityCheck()` ואימות עמודות בפועל
- [ ] יש משתמש עם `role='instructor'`
- [ ] RLS policies מוגדרות (אם קיימות) - יאומת על ידי DB Reality Check

---

## 9. DB Reality Check - תוצאות

**תאריך בדיקה:** [למלא לאחר הרצה]  
**סטטוס:** ⏳ ממתין להרצה

### הוראות הרצה:

1. **הפעל את האפליקציה:**
   ```bash
   npm run dev
   ```

2. **פתח קונסול דפדפן (F12)**

3. **הסקריפט ירוץ אוטומטית**, או הרץ ידנית:
   ```javascript
   window.runDBRealityCheck()
   ```

4. **העתק את התוצאות** מהקונסול למטה

### תוצאות בדיקה:

#### Environment Variables:
- ✅ `VITE_SUPABASE_URL` - נמצא בקוד: `src/lib/supabaseClient.ts:3`
- ✅ `VITE_SUPABASE_ANON_KEY` - נמצא בקוד: `src/lib/supabaseClient.ts:4`
- 📍 מקור: `.env.local` (local) או Vercel env vars (production)

#### טבלאות:

| טבלה | סטטוס | עמודות שנמצאו | הערות |
|------|--------|----------------|-------|
| `question_bank` | ⏳ ממתין | - | - |
| `profiles` | ⏳ ממתין | - | - |
| `exams` | ⏳ ממתין | - | - |
| `exam_items` | ⏳ ממתין | - | - |
| `submissions` | ⏳ ממתין | - | - |

### שגיאות (אם יש):

[למלא לאחר הרצה]

---

## 10. סיכום DB Reality Check

**סטטוס כללי:** ⏳ **PENDING** - ממתין להרצה

**מה בוצע:**
- ✅ זיהוי מקור משתני סביבה (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- ✅ יצירת סקריפט בדיקה (`src/utils/dbRealityCheck.ts`)
- ✅ הוספת הרצה אוטומטית ב-dev mode (`App.tsx`)
- ✅ חשיפה ל-`window.runDBRealityCheck()` להרצה ידנית
- ✅ עדכון דוח Pre-Flight לשקף קיום כל הטבלאות

**מה נדרש:**
- ⏳ הרצת DB Reality Check בפועל
- ⏳ אימות עמודות בפועל בכל טבלה
- ⏳ זיהוי פערים בין סכימה משוערת לסכימה בפועל
- ⏳ עדכון דוח זה עם תוצאות בפועל

**הצעד הבא:**
1. הרץ את האפליקציה במצב dev
2. בדוק את הקונסול לתוצאות DB Reality Check
3. העתק את התוצאות לסעיף 9 למעלה
4. עדכן את הדוח עם העמודות בפועל
5. רק אז - המשך ל-M1

---

**סיום דוח Pre-Flight**

**הערה:** דוח זה עודכן לאחר אישור המשתמש שכל הטבלאות קיימות. יש להריץ DB Reality Check לפני תחילת M1 כדי לאמת את הסכימה בפועל.

