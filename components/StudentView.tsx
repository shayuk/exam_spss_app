
import React, { useState, useMemo, useEffect } from 'react';
import type { GeneratedExamQuestion, GeneratedExamQuestionMCQ } from '../types';

declare const XLSX: any;

interface StudentViewProps {
  exam: GeneratedExamQuestion[];
  onExamReset: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({ exam, onExamReset }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentDetails, setStudentDetails] = useState({ id: '', name: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state when a new exam is generated
    setAnswers({});
    setStudentDetails({ id: '', name: '' });
    setIsSubmitted(false);
    setError('');
  }, [exam]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const progress = useMemo(() => {
    if (exam.length === 0) return 0;
    const answeredCount = Object.keys(answers).filter(key => answers[key]?.trim() !== '').length;
    return Math.round((answeredCount / exam.length) * 100);
  }, [answers, exam.length]);

  const handleSubmit = () => {
    if (studentDetails.id.trim() === '' || studentDetails.name.trim() === '') {
      setError('יש למלא את כל פרטי הסטודנט לפני ההגשה.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setError('');

    let correctAnswersCount = 0;
    const mcqCount = exam.filter(q => !q.isOpen).length;

    const results = exam.map((q, index) => {
      const studentAnswerRaw = answers[q.id] || 'לא נענה';
      let studentAnswerText = studentAnswerRaw;
      let correctAnswerText = '';
      let isCorrectStatus = 'ללא בדיקה'; // Default for open questions

      if (!q.isOpen) {
        const mcq = q as GeneratedExamQuestionMCQ;
        correctAnswerText = mcq.options[mcq.correct_answer_index];
        const studentAnswerIndex = parseInt(studentAnswerRaw, 10);

        if (!isNaN(studentAnswerIndex) && mcq.shuffledOptions[studentAnswerIndex]) {
          studentAnswerText = mcq.shuffledOptions[studentAnswerIndex];
          if (studentAnswerText === correctAnswerText) {
            isCorrectStatus = 'נכון';
            correctAnswersCount++;
          } else {
            isCorrectStatus = 'טועה';
          }
        } else {
          studentAnswerText = 'לא נענה';
          isCorrectStatus = 'טועה';
        }
      } else {
        correctAnswerText = 'שאלה פתוחה';
      }

      return {
        'שאלה #': index + 1,
        'נוסח השאלה': q.question_text,
        'סוג': q.isOpen ? 'פתוחה' : 'רב ברירה',
        'תשובת הסטודנט': studentAnswerText,
        'תשובה נכונה': correctAnswerText,
        'נכון/טועה': isCorrectStatus,
      };
    });

    const score = mcqCount > 0 ? (correctAnswersCount / mcqCount) * 100 : 0;

    const finalData = [
      { 'שאלה #': 'שם מלא', 'נוסח השאלה': studentDetails.name, 'סוג': '', 'תשובת הסטודנט': '', 'תשובה נכונה': '', 'נכון/טועה': '' },
      { 'שאלה #': 'ת.ז.', 'נוסח השאלה': studentDetails.id, 'סוג': '', 'תשובת הסטודנט': '', 'תשובה נכונה': '', 'נכון/טועה': '' },
      { 'שאלה #': 'ציון (שאלות רב ברירה)', 'נוסח השאלה': `${score.toFixed(1)}%`, 'סוג': `(${correctAnswersCount}/${mcqCount})`, 'תשובת הסטודנט': '', 'תשובה נכונה': '', 'נכון/טועה': '' },
      {}, // Empty row for spacing
      ...results
    ];

    const worksheet = XLSX.utils.json_to_sheet(finalData, { skipHeader: true });
    
    // Manually create header
    const header = ['שאלה #', 'נוסח השאלה', 'סוג', 'תשובת הסטודנט', 'תשובה נכונה', 'נכון/טועה'];
    XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: 'A1' });

    worksheet['!cols'] = [
      { wch: 8 },  // שאלה #
      { wch: 60 }, // נוסח השאלה
      { wch: 15 }, // סוג
      { wch: 35 }, // תשובת הסטודנט
      { wch: 35 }, // תשובה נכונה
      { wch: 10 }, // נכון/טועה
    ];

    if (!worksheet['!props']) worksheet['!props'] = {};
    worksheet['!props'].RTL = true;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Answers');
    XLSX.writeFile(workbook, `spss_exam_${studentDetails.id}.xlsx`);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="p-8 text-center bg-white rounded-b-2xl">
        <h2 className="text-3xl font-bold text-green-600 mb-4">✅ המבחן הוגש בהצלחה!</h2>
        <p className="text-gray-600 mb-6">קובץ התשובות שלך הורד למחשב.</p>
        <button
          onClick={onExamReset}
          className="bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          התחל מחדש
        </button>
      </div>
    );
  }

  if (exam.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-b-2xl min-h-[40vh] flex items-center justify-center">
        <h2 className="text-2xl font-semibold">עדיין לא נוצר מבחן. יש לחזור לעמוד המרצה כדי ליצור שאלון.</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white rounded-b-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">התקדמות: {progress}%</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-6">
        {exam.map((q, index) => (
          <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-lg text-gray-800 mb-2">שאלה {index + 1}</h4>
            {q.imageData && (
                <div className="my-4 flex justify-center">
                    <img src={q.imageData} alt={`תמונה עבור שאלה ${index + 1}`} className="max-w-full md:max-w-lg rounded-lg shadow-md object-contain" />
                </div>
            )}
            <p className="text-gray-700 whitespace-pre-line mb-4">{q.question_text}</p>
            {q.isOpen ? (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="הקלד/י את תשובתך כאן..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                rows={4}
              />
            ) : (
              <div className="space-y-3">
                {(q as GeneratedExamQuestionMCQ).shuffledOptions.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center p-3 border rounded-lg hover:bg-indigo-50 transition cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value={optIndex}
                      checked={answers[q.id] === String(optIndex)}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="mr-3 text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-xl font-bold text-gray-800 mb-4">פרטי סטודנט והגשה</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="שם מלא"
            value={studentDetails.name}
            onChange={(e) => setStudentDetails({ ...studentDetails, name: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            placeholder="תעודת זהות"
            value={studentDetails.id}
            onChange={(e) => setStudentDetails({ ...studentDetails, id: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-green-500 text-white font-bold text-lg py-4 px-8 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
        >
          הגש והורד קובץ תשובות
        </button>
      </div>
    </div>
  );
};

export default StudentView;
