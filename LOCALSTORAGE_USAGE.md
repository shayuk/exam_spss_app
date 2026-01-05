# תיעוד שימושי localStorage בפרויקט

## סקירה כללית
האפליקציה משתמשת ב-localStorage לשמירת נתונים מקומיים בדפדפן. עם המיגרציה ל-Supabase, רוב השימושים יוחלפו בקריאות למסד הנתונים.

## רשימת קבצים ופונקציות

### 1. App.tsx

#### שורה 19-28: טעינת שאלות שנוספו
```typescript
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
**מטרה:** טעינת שאלות שנוספו על ידי המרצה מהמאגר המקומי.
**מיגרציה:** יוחלף ב-`listQuestions()` מ-Supabase.

#### שורה 43: בדיקת סטטוס התחברות
```typescript
const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
setIsLoggedIn(loggedInStatus);
```
**מטרה:** שמירת מצב התחברות בין סשנים.
**מיגרציה:** יוחלף ב-`supabase.auth.getSession()`.

#### שורה 45-48: טעינת הגדרות מבחן
```typescript
const savedConfig = localStorage.getItem('examConfig');
if (savedConfig) {
  setExamConfig(JSON.parse(savedConfig));
}
```
**מטרה:** שמירת הגדרות מבחן (מספר שאלות, אחוזי קושי).
**מיגרציה:** יישאר ב-localStorage (נתונים מקומיים למשתמש).

#### שורה 57: טעינת סיסמה
```typescript
const storedPassword = localStorage.getItem('examPassword') || '1234';
```
**מטרה:** שמירת סיסמת המרצה.
**מיגרציה:** יוחלף ב-Supabase Auth (אימות אמיתי).

#### שורה 60: שמירת סטטוס התחברות
```typescript
localStorage.setItem('isLoggedIn', 'true');
```
**מטרה:** שמירת מצב התחברות לאחר התחברות מוצלחת.
**מיגרציה:** יוחלף ב-Supabase Auth session.

#### שורה 69: מחיקת סטטוס התחברות
```typescript
localStorage.removeItem('isLoggedIn');
```
**מטרה:** התנתקות מהמערכת.
**מיגרציה:** יוחלף ב-`supabase.auth.signOut()`.

#### שורה 74: שמירת סיסמה
```typescript
localStorage.setItem('examPassword', newPassword);
```
**מטרה:** עדכון סיסמת המרצה.
**מיגרציה:** יוחלף ב-Supabase Auth (שינוי סיסמה).

#### שורה 79: שמירת הגדרות מבחן
```typescript
localStorage.setItem('examConfig', JSON.stringify(newConfig));
```
**מטרה:** שמירת הגדרות מבחן.
**מיגרציה:** יישאר ב-localStorage (נתונים מקומיים).

#### שורה 83-89: הוספת שאלה חדשה
```typescript
const currentAddedBank: QuestionBank = JSON.parse(localStorage.getItem('addedQuestions') || '{"questions":[], "openEndedQuestions":[]}')
if (question.isOpen) {
    currentAddedBank.openEndedQuestions.push(question);
} else {
    currentAddedBank.questions.push(question as QuestionMCQ);
}
localStorage.setItem('addedQuestions', JSON.stringify(currentAddedBank));
```
**מטרה:** הוספת שאלה חדשה למאגר המקומי.
**מיגרציה:** יוחלף ב-`createQuestion()` מ-Supabase.

## סיכום

### מפתחות localStorage בשימוש:
1. **`addedQuestions`** - שאלות שנוספו על ידי המרצה (יוחלף ב-Supabase)
2. **`isLoggedIn`** - סטטוס התחברות (יוחלף ב-Supabase Auth)
3. **`examConfig`** - הגדרות מבחן (יישאר ב-localStorage)
4. **`examPassword`** - סיסמת המרצה (יוחלף ב-Supabase Auth)

### תוכנית מיגרציה:
- ✅ שאלות (`addedQuestions`) → Supabase `question_bank` table
- ✅ אימות (`isLoggedIn`, `examPassword`) → Supabase Auth
- ⏸️ הגדרות מבחן (`examConfig`) → נשאר ב-localStorage (נתונים מקומיים)

