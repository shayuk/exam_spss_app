
import { QuestionBank } from './types';

export const FULL_QUESTION_BANK: QuestionBank = {
  questions: [
    {
      "id": "q1",
      "question_text": "חוקרת ידועה ביקשה לבחון את הקשר בין מרחק נסיעה בקילומטרים של סטודנטים מביתם לקמפוס\nלבין רמת התסכול שלהם (1 = רמת תסכול נמוכה, 2 = רמת תסכול בינונית, 3 = רמת תסכול גבוהה, 4 = רמת תסכול גבוהה מאוד).\nהחוקרת ביקשה לבחון קשר זה בנפרד על פי תחום לימודים דהיינו, לסטודנטים לעבודה סוציאלית ולסטודנטים אחרים (1 = סטודנטים לעבודה סוציאלית, 2 = סטודנטים אחרים).\nמהן הפקודות הנכונות?",
      "options": [
        "חלוקת נבדקים על פי תחום לימודים עם Split File ואז ביצוע Correlate Bivariate עם חישוב של מקדם המתאם של ספירמן",
        "בחירת נבדקים על פי דירוג רמת תסכול עם Sort Cases ואז ביצוע Correlate Bivariate עם חישוב של מקדם המתאם של פירסון.",
        "בחירת נבדקים על פי מרחק נסיעה בקילומטרים עם Select Cases ואז ביצוע Correlate Bivariate עם חישוב של מקדם המתאם של ספירמן",
        "חלוקת הנבדקים על פי רמת תסכול עם Split File ואז ביצוע Correlate Bivariate עם חישוב של מקדם המתאם של ספירמן"
      ],
      "correct_answer_index": 0,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q2",
      "question_text": "מבחן T למדגמים בלתיתלויים שונה ממבחן T למדגמים תלויים מכיוון ש...",
      "options": [
        "הוא משווה בין קבוצות על פי מתאמים",
        "הוא מצריך השוואה  בין קבוצות על פי ממוצעים",
        "הוא מצריך לוודא תחילה כי הנחת שיויון השונויות מתקיימת ",
        "הוא משווה בין ממוצעים של יותר משתי קבוצות"
      ],
      "correct_answer_index": 2,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q3",
      "question_text": "באיזה סוג גרף היית משתמש כדי לראות את ההתפלגות של משתנה בסולם כמותי רציף?",
      "options": [ "HISTOGRAM", "PIE CHART", "BAR CHART", "SCATTER PLOT" ],
      "correct_answer_index": 0,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q4",
      "question_text": "מהו סדר הפקודות הנכון בכדי לבצע ניתוח שונות חד-כיוונית (One-Way ANOVA)?",
      "options": [
        "ראשית ANALYZE, לאחר מכן COMPARE MEANS ולבסוף ONE-WAY ANOVA.",
        "ראשית ANALYZE, לאחר מכן GENERAL LINEAR MODEL ולבסוף MULTIVARIATE.",
        "ראשית ANALYZE, לאחר מכן RELIABILITY ANALYSIS ולבסוף COMPUTE.",
        "ראשית ANALYZE, לאחר מכן GENERAL LINEAR MODEL ולבסוף UNIVARIATE."
      ],
      "correct_answer_index": 0,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q5",
      "question_text": "איזו פקודה ב-SPSS משמשת ליצירת משתנה חדש מתוך חישוב מתמטי בין משתנים קיימים?",
      "options": [ "Compute", "Recode", "Frequencies", "Split File" ],
      "correct_answer_index": 0,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q6",
      "question_text": "מתי נשתמש בפקודת Crosstabs?",
      "options": [
        "כאשר נרצה לחשב מתאם בין שני משתנים כמותיים",
        "כאשר נרצה לחשב תלות  בין משתנים נומינליים",
        "כאשר נרצה ליצור משתנה חדש",
        "כאשר נרצה לחשב ממוצעים לפי קבוצות"
      ],
      "correct_answer_index": 1,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q7",
      "question_text": "באיזו סיטואציה יש להשתמש במבחן t למדגמים תלויים?",
      "options": [
        "כאשר משווים בין שתי קבוצות בלתי תלויות",
        "כאשר מודדים את אותם נבדקים לפני ואחרי התערבות",
        "כאשר נרצה לבדוק קשר בין שני משתנים כמותיים",
        "כאשר רוצים להשוות בין יותר משתי קבוצות"
      ],
      "correct_answer_index": 1,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q8",
      "question_text": "איזו פקודה מאפשרת לבצע פילוח של ניתוח לפי קבוצות ב-SPSS?",
      "options": [ "Split File", "Select Cases", "Recode", "Reliability Analysis" ],
      "correct_answer_index": 0,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q9",
      "question_text": "מה המשמעות של ערך אלפא של קרונבאך גבוה מ-0.8?",
      "options": [
        "המדד אינו מהימן כלל",
        "יש לשפר את השאלות",
        "יש מהיימנות גבוה בין הפריטים/היגדים",
        "המדד מצביע על מתאם בין משתנים"
      ],
      "correct_answer_index": 2,
      "bloom_level": "Analyze",
      "isOpen": false
    },
    {
      "id": "q10",
      "question_text": "מתי נכון להשתמש בניתוח MANOVA?",
      "options": [
        "כאשר יש משתנה תלוי אחד",
        "כאשר כל המשתנים בסולם שמי",
        "כאשר יש מספר משתנים תלויים כמותיים",
        "כאשר מדובר בקשר ליניארי בין שני משתנים"
      ],
      "correct_answer_index": 2,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q11",
      "question_text": "אם מקדם פירסון הוא r = 0.87, כיצד יש לפרש זאת?",
      "options": [ "אין קשר בין המשתנים", "קשר חלש ושלילי", "קשר חזק וחיובי", "קשר בינוני וחיובי" ],
      "correct_answer_index": 2,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q12",
      "question_text": "מהי מטרת מבחן ה-Levene ב-SPSS?",
      "options": [ "בדיקת מובהקות של שונות בין קבוצות", "בדיקת הומוגניות של שונויות", "בדיקת נורמליות של משתנה", "בדיקת קורלציה" ],
      "correct_answer_index": 1,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q13",
      "question_text": "מהי תוצאה אפשרית של בעיית multicollinearity חמורה?",
      "options": [ "מובהקות גבוהה במודל", "יציבות גבוהה של מקדמי הרגרסיה", "קושי להבחין בתרומה הייחודית של משתנה מנבא", "פשטות בפרשנות המודל" ],
      "correct_answer_index": 2,
      "bloom_level": "Analyze",
      "isOpen": false
    },
    {
      "id": "q14",
      "question_text": "מה מאפשרת הפקודה Select Cases?",
      "options": [ "לבחור תת-קבוצה של נתונים לניתוח", "לפצל נתונים לפי קבוצות", "להמיר ערכים", "לחשב ממוצעים" ],
      "correct_answer_index": 0,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q15",
      "question_text": "כאשר רוצים לבחון האם קיים הבדל מובהק ברמת שביעות רצון בין שלוש קבוצות טיפול, באיזה מבחן נשתמש?",
      "options": [ "t למדגמים תלויים", "t למדגמים בלתי תלויים", "One-Way ANOVA", "מבחן חי בריבוע" ],
      "correct_answer_index": 2,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q16",
      "question_text": "מהי מטרת ניתוח גורמים מסוג Exploratory Factor Analysis (EFA)?",
      "options": [ "לבחון הבדלים בין קבוצות", "לבחון קשר בין משתנים", "לזהות מבנים סמויים בין פריטים", "להשוות ממוצעים" ],
      "correct_answer_index": 2,
      "bloom_level": "Analyze",
      "isOpen": false
    },
    {
      "id": "q17",
      "question_text": "מתי נשתמש במבחן ANCOVA?",
      "options": [ "כאשר יש לנו משתנה מתאם שברצוננו לשלוט עליו סטטיסטית", "כאשר כל המשתנים הם נומינליים", "כאשר בודקים מתאם בין משתנים", "כאשר בודקים הבדל בין שתי קבוצות בלבד" ],
      "correct_answer_index": 0,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q18",
      "question_text": "מה בודק מקדם קרונבאך אלפא?",
      "options": [ "הבדלים בין קבוצות", "מובהקות קשר בין משתנים", "מהימנות פנימית של כלי מדידה", "אינטראקציה בין משתנים" ],
      "correct_answer_index": 2,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q19",
      "question_text": "כאשר מבצעים Recode Into Different Variables, מה נשמר?",
      "options": [ "המשתנה החדש המחליף את המשתנה המקורי", "קובץ פלט סטטיסטי עם הערכים של  המשתנה החדש עם הערכים המוקודדיםו", "המשתנה המקורי והמשתנה החדש שבנינו", "שום דבר לא נשמר, כל הנתונים נמחקים" ],
      "correct_answer_index": 2,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q20",
      "question_text": "מה המשמעות של סטיית תקן גבוהה במדגם?",
      "options": [ "כל הנתונים קרובים לאותה נקודה", "יש מעט מאוד שונות", "הנתונים מפוזרים מאוד סביב הממוצע", "אין אפשרות לחשב ממוצע" ],
      "correct_answer_index": 2,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q21",
      "question_text": "איזו פקודה ב-SPSS תציג תיאור מלא של משתנה כולל תדירויות?",
      "options": [ "Recode", "Compute", "Frequencies", "Split File" ],
      "correct_answer_index": 2,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q22",
      "question_text": "כאשר ערך p קטן מ-0.05, מה ניתן להסיק?",
      "options": [ "אין הבדל מובהק", "הבדל מובהק סטטיסטית", "הנתונים אינם מתאימים", "תוצאה אקראית" ],
      "correct_answer_index": 1,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q23",
      "question_text": "מה משמעות מקדם מתאם של r = -0.65?",
      "options": [ "קשר חיובי חזק", "קשר שלילי חזק", "אין קשר", "קשר שלילי בינוני" ],
      "correct_answer_index": 3,
      "bloom_level": "Understand",
      "isOpen": false
    },
    {
      "id": "q24",
      "question_text": "מה תפקידה של פקודת COMPUTE ב-SPSS?",
      "options": [ "יצירת משתנה חדש על סמך משתנים קיימים", "קידוד מחדש של ערכי משתנים", "פילוח קובץ הנתונים", "בדיקת מהימנות" ],
      "correct_answer_index": 0,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q25",
      "question_text": "מהי אינטראקציה בניתוח שונות דו-כיווני?",
      "options": [ "השפעת כל אחד מהמשתנים הבלתי תלויים בנפרד", "ההשפעה המשולבת של המשתנים הבלתי תלויים", "ממוצע כללי של כל הקבוצות", "שונות בין קבוצות" ],
      "correct_answer_index": 1,
      "bloom_level": "Analyze",
      "isOpen": false
    },
    {
      "id": "q26",
      "question_text": "מה בודק מבחן Chi-Square?",
      "options": [ "קשר בין שני משתנים נומינליים", "הבדל בין ממוצעי שתי קבוצות", "מהימנות של שאלון", "נורמליות התפלגות" ],
      "correct_answer_index": 0,
      "bloom_level": "Apply",
      "isOpen": false
    },
    {
      "id": "q27",
      "question_text": "מהי רגרסיה לוגיסטית?",
      "options": [ "ניבוי משתנה תלוי כמותי", "ניבוי משתנה תלוי דיכוטומי", "השוואת ממוצעים", "בדיקת קשר בין שני משתנים" ],
      "correct_answer_index": 1,
      "bloom_level": "Evaluate",
      "isOpen": false
    },
    {
      "id": "q28",
      "question_text": "מה משמעות המונח 'שגיאת התקן של הממוצע'?",
      "options": [ "סטיית התקן של כלל האוכלוסייה", "עד כמה צפוי שממוצע המדגם יהיה קרוב לממוצע האוכלוסייה", "הערך הממוצע של המדגם", "ההפרש בין הערך הגבוה לנמוך ביותר" ],
      "correct_answer_index": 1,
      "bloom_level": "Create",
      "isOpen": false
    },
    {
      "id": "q29",
      "question_text": "איך ניצור תרשים פיזור (Scatter Plot) ב-SPSS?",
      "options": [ "דרך תפריט Graphs, Legacy Dialogs, Scatter/Dot", "דרך תפריט Analyze, Descriptive Statistics, Frequencies", "דרך תפריט Data, Split File", "דרך תפריט Transform, Compute Variable" ],
      "correct_answer_index": 0,
      "bloom_level": "Remember",
      "isOpen": false
    },
    {
      "id": "q30",
      "question_text": "מתי נשתמש בניתוח שונות עם מדידות חוזרות (Repeated Measures ANOVA)?",
      "options": [ "כאשר משווים שלוש קבוצות או יותר של נבדקים שונים", "כאשר מודדים את אותם נבדקים שלוש פעמים או יותר", "כאשר רוצים לנבא משתנה תלוי", "כאשר רוצים לבדוק קשר בין משתנים" ],
      "correct_answer_index": 1,
      "bloom_level": "Evaluate",
      "isOpen": false
    }
  ],
  openEndedQuestions: [
    { "id": "o1", "question_text": "חוקר מעוניין לבדוק אם יש הבדל ברמת האושר בין עיר, כפר או קיבוץ. מהם השלבים ב-SPSS?", "isOpen": true, "bloom_level": "Apply" },
    { "id": "o2", "question_text": "סטודנט למדידת חרדה חברתית: כיצד לבדוק מהימנות פנימית ב-SPSS?", "isOpen": true, "bloom_level": "Apply" },
    { "id": "o3", "question_text": "מרצה טוען: קשר בין שעות למבחן לציון. כיצד לבדוק ב-SPSS?", "isOpen": true, "bloom_level": "Analyze" },
    { "id": "o4", "question_text": "פסיכולוג ארגוני: ניבוי שביעות רצון על פי גיל, ותק ושכר. איזה ניתוח ב-SPSS?", "isOpen": true, "bloom_level": "Evaluate" },
    { "id": "o5", "question_text": "מנהל: השפעת התערבות על ציוני מתמטיקה לפני ואחרי. איזה מבחן?", "isOpen": true, "bloom_level": "Apply" }
  ]
};
