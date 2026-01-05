
import React, { useState, useMemo, useEffect } from 'react';
import type { ExamConfig, QuestionBank, QuestionMCQ, QuestionOpen } from '../types';
import { supabase, supabaseConfigStatus } from '../src/lib/supabaseClient';
import { listQuestions } from '../src/services/questionsRepo';
import SupabaseLoginCard from './SupabaseLoginCard';

const useSupabase = supabaseConfigStatus.isConfigured;

interface InstructorViewProps {
  isLoggedIn: boolean;
  authenticatedToSupabase: boolean;
  onLogin: (password: string) => void;
  onPasswordChange: (newPassword: string) => void;
  examConfig: ExamConfig;
  onConfigChange: (newConfig: ExamConfig) => void;
  questionBank: QuestionBank;
  onAddQuestion: (question: QuestionMCQ | QuestionOpen) => void;
  onGenerateExam: () => void;
  loginError: string;
  onSupabaseAuthChange: () => void;
}

const StatCard: React.FC<{ label: string; value: number; ok: boolean }> = ({ label, value, ok }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm transition-transform hover:scale-105">
    <div className={`text-3xl font-bold ${ok ? 'text-green-500' : 'text-red-500'}`}>{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
);

const ConfigSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">{title}</h3>
        {children}
    </div>
);

const InstructorView: React.FC<InstructorViewProps> = ({
  isLoggedIn,
  authenticatedToSupabase,
  onLogin,
  onPasswordChange,
  examConfig,
  onConfigChange,
  questionBank,
  onAddQuestion,
  onGenerateExam,
  loginError,
  onSupabaseAuthChange,
}) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq',
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    bloom: 'Remember' as const,
    imageData: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    session: boolean;
    role: string | null;
    questionBankCount: number;
    loading: boolean;
  }>({
    session: false,
    role: null,
    questionBankCount: 0,
    loading: true,
  });

  // Check connection status (session, role, question_bank)
  const checkConnection = async () => {
    if (!useSupabase) {
      setConnectionStatus({
        session: false,
        role: 'local',
        questionBankCount: questionBank.questions.length + questionBank.openEndedQuestions.length,
        loading: false,
      });
      return;
    }

    try {
      setConnectionStatus(prev => ({ ...prev, loading: true }));
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;

      // Get role from profiles
      let role: string | null = null;
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        role = profile?.role || null;
      }

      // Count questions in question_bank
      const questions = await listQuestions();
      const questionBankCount = questions.length;

      setConnectionStatus({
        session: hasSession,
        role: role || 'לא זוהה',
        questionBankCount,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus({
        session: false,
        role: 'שגיאה',
        questionBankCount: 0,
        loading: false,
      });
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      checkConnection();
    } else {
      setConnectionStatus({
        session: false,
        role: null,
        questionBankCount: 0,
        loading: false,
      });
    }
  }, [isLoggedIn, questionBank]);

  const stats = useMemo(() => {
    const mcq = questionBank.questions;
    const open = questionBank.openEndedQuestions;
    const easy = mcq.filter(q => ['Remember', 'Understand'].includes(q.bloom_level)).length;
    const medium = mcq.filter(q => ['Apply', 'Analyze'].includes(q.bloom_level)).length;
    const hard = mcq.filter(q => ['Evaluate', 'Create'].includes(q.bloom_level)).length;
    return { mcq, open, easy, medium, hard };
  }, [questionBank]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };
  
  const handlePasswordChange = () => {
      if (newPassword.trim().length < 4) {
          setMessage({type: 'error', text: 'הסיסמה חייבת להכיל לפחות 4 תווים.'});
          setTimeout(() => setMessage(null), 3000);
          return;
      }
      onPasswordChange(newPassword);
      setNewPassword('');
      setMessage({type: 'success', text: 'הסיסמה עודכנה בהצלחה!'});
      setTimeout(() => setMessage(null), 3000);
  }

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...examConfig, [e.target.name]: +e.target.value });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewQuestion({ ...newQuestion, imageData: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.text.trim() === '') {
        setMessage({type: 'error', text: 'נוסח השאלה לא יכול להיות ריק.'});
        setTimeout(() => setMessage(null), 3000);
        return;
    }
    if(newQuestion.type === 'mcq' && newQuestion.options.some(opt => opt.trim() === '')){
        setMessage({type: 'error', text: 'יש למלא את כל האפשרויות לשאלת רב ברירה.'});
        setTimeout(() => setMessage(null), 3000);
        return;
    }

    let questionToAdd: QuestionMCQ | QuestionOpen;
    if (newQuestion.type === 'mcq') {
        questionToAdd = {
            id: `q-added-${Date.now()}`,
            question_text: newQuestion.text,
            options: newQuestion.options,
            correct_answer_index: newQuestion.correct,
            bloom_level: newQuestion.bloom,
            isOpen: false,
            imageData: newQuestion.imageData || undefined,
        };
    } else {
        questionToAdd = {
            id: `o-added-${Date.now()}`,
            question_text: newQuestion.text,
            bloom_level: newQuestion.bloom,
            isOpen: true,
            imageData: newQuestion.imageData || undefined,
        };
    }
    onAddQuestion(questionToAdd);
    setNewQuestion({ type: 'mcq', text: '', options: ['', '', '', ''], correct: 0, bloom: 'Remember', imageData: '' });
    setMessage({type: 'success', text: 'השאלה נוספה בהצלחה למאגר!'});
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSupabaseAuthChange = async () => {
    await checkConnection();
    onSupabaseAuthChange();
  };
  
  if (!isLoggedIn) {
    return (
      <div className="p-4 sm:p-8 flex flex-col justify-center items-center bg-gray-100 min-h-[50vh]">
        <SupabaseLoginCard 
          onAuthChange={handleSupabaseAuthChange}
          compact={true}
        />
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">🔐 התחברות למערכת</h3>
          <p className="text-center text-gray-500 mb-6">הכנס סיסמה (ברירת מחדל: <strong>1234</strong>)</p>
          {authenticatedToSupabase && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center text-sm font-semibold">
              ✓ מחובר ל-Supabase - ניתן להתחבר גם בלי סיסמה
            </div>
          )}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              התחבר
            </button>
            {loginError && <p className="text-red-500 text-sm text-center mt-4">{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {message && (
          <div className={`p-4 mb-4 rounded-lg text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
          </div>
      )}

      {/* Supabase Login Section */}
      <SupabaseLoginCard 
        onAuthChange={handleSupabaseAuthChange}
        compact={false}
      />

      {/* Connection Status Section */}
      {useSupabase && (
        <ConfigSection title="🔌 בדיקת חיבור">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">מצב התחברות</div>
              <div className={`text-lg font-bold ${connectionStatus.session ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.loading ? 'טוען...' : connectionStatus.session ? '✓ מחובר' : '✗ לא מחובר'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">תפקיד (Role)</div>
              <div className="text-lg font-bold text-indigo-600">
                {connectionStatus.loading ? 'טוען...' : connectionStatus.role || 'לא זוהה'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">שאלות במאגר (Supabase)</div>
              <div className="text-lg font-bold text-blue-600">
                {connectionStatus.loading ? 'טוען...' : connectionStatus.questionBankCount}
              </div>
            </div>
          </div>
        </ConfigSection>
      )}

      <ConfigSection title="🔑 שנה סיסמה">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="סיסמה חדשה"
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={handlePasswordChange} className="bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">שנה סיסמה</button>
          </div>
      </ConfigSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ConfigSection title="⚙️ הגדרות מבחן">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="font-semibold text-gray-600 block mb-1">מספר שאלות כולל:</label>
                    <input type="number" name="totalQuestions" value={examConfig.totalQuestions} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600 block mb-1">רב-ברירה:</label>
                    <input type="number" name="mcqQuestions" value={examConfig.mcqQuestions} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600 block mb-1">פתוחות:</label>
                    <input type="number" name="openQuestions" value={examConfig.openQuestions} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
                </div>
            </div>
          </ConfigSection>
          
          <ConfigSection title="📊 רמות קושי (%)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-gray-600 block mb-1">קלה:</label>
                <input type="number" name="easyPercent" value={examConfig.easyPercent} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
              </div>
              <div>
                <label className="font-semibold text-gray-600 block mb-1">בינונית:</label>
                <input type="number" name="mediumPercent" value={examConfig.mediumPercent} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
              </div>
              <div>
                <label className="font-semibold text-gray-600 block mb-1">קשה:</label>
                <input type="number" name="hardPercent" value={examConfig.hardPercent} onChange={handleConfigChange} className="w-full p-2 border rounded-md"/>
              </div>
            </div>
          </ConfigSection>

          <ConfigSection title="📈 סטטיסטיקות מאגר">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="שאלות רב ברירה" value={stats.mcq.length} ok={stats.mcq.length >= examConfig.mcqQuestions} />
                <StatCard label="שאלות פתוחות" value={stats.open.length} ok={stats.open.length >= examConfig.openQuestions} />
                <StatCard label="רמה קלה" value={stats.easy} ok={stats.easy > 0} />
                <StatCard label="רמה בינונית" value={stats.medium} ok={stats.medium > 0} />
                <StatCard label="רמה קשה" value={stats.hard} ok={stats.hard > 0} />
                <StatCard label="סה״כ" value={stats.mcq.length + stats.open.length} ok={true} />
            </div>
          </ConfigSection>
        </div>

        <div>
            <ConfigSection title="➕ הוספת שאלה חדשה">
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-gray-600 block mb-1">סוג שאלה:</label>
                        <select value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})} className="w-full p-2 border rounded-md bg-white text-gray-800">
                            <option value="mcq">רב ברירה</option>
                            <option value="open">פתוחה</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold text-gray-600 block mb-1">נוסח השאלה:</label>
                        <textarea value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} rows={3} className="w-full p-2 border rounded-md"></textarea>
                    </div>
                     <div>
                        <label className="font-semibold text-gray-600 block mb-1">העלאת תמונה (אופציונלי):</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        {newQuestion.imageData && (
                            <div className="mt-2 relative w-fit">
                                <img src={newQuestion.imageData} alt="Preview" className="max-w-xs max-h-40 rounded-md object-contain border" />
                                <button onClick={() => setNewQuestion({...newQuestion, imageData: ''})} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center -mt-2 -mr-2 text-xs font-bold">&times;</button>
                            </div>
                        )}
                    </div>
                    {newQuestion.type === 'mcq' && (
                        <div className="space-y-2">
                            <label className="font-semibold text-gray-600 block">אפשרויות ותשובה נכונה:</label>
                            {newQuestion.options.map((opt, i) => (
                                <input key={i} type="text" placeholder={`אפשרות ${i + 1}`} value={opt} onChange={e => {
                                    const newOpts = [...newQuestion.options];
                                    newOpts[i] = e.target.value;
                                    setNewQuestion({...newQuestion, options: newOpts});
                                }} className="w-full p-2 border rounded-md" />
                            ))}
                            <select value={newQuestion.correct} onChange={e => setNewQuestion({...newQuestion, correct: +e.target.value})} className="w-full p-2 border rounded-md bg-white text-gray-800">
                                {newQuestion.options.map((_, i) => <option key={i} value={i}>אפשרות {i + 1} נכונה</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="font-semibold text-gray-600 block mb-1">רמת Bloom:</label>
                        <select value={newQuestion.bloom} onChange={e => setNewQuestion({...newQuestion, bloom: e.target.value as any})} className="w-full p-2 border rounded-md bg-white text-gray-800">
                            <option value="Remember">Remember</option>
                            <option value="Understand">Understand</option>
                            <option value="Apply">Apply</option>
                            <option value="Analyze">Analyze</option>
                            <option value="Evaluate">Evaluate</option>
                            <option value="Create">Create</option>
                        </select>
                    </div>
                    <button onClick={handleAddQuestion} className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors">הוסף שאלה למאגר</button>
                </div>
            </ConfigSection>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onGenerateExam}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-xl"
        >
          🎯 צור שאלון חדש
        </button>
      </div>
    </div>
  );
};

export default InstructorView;
