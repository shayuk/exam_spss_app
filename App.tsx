
import React, { useState, useEffect, useCallback } from 'react';
import { FULL_QUESTION_BANK } from './constants';
import type { ExamConfig, QuestionBank, Question, GeneratedExamQuestion, QuestionMCQ, QuestionOpen, GeneratedExamQuestionMCQ } from './types';
import InstructorView from './components/InstructorView';
import StudentView from './components/StudentView';
import Header from './components/Header';
import { listQuestions, createQuestion } from './src/services/questionsRepo';
import { supabase, supabaseConfigStatus } from './src/lib/supabaseClient';

// Check if we're in dev mode and should use localStorage fallback
const isDev = import.meta.env.DEV;

// Use the centralized Supabase configuration status
const useSupabase = supabaseConfigStatus.isConfigured;

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'instructor' | 'student'>('instructor');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authenticatedToSupabase, setAuthenticatedToSupabase] = useState<boolean>(false);
  const [loginError, setLoginError] = useState('');
  const [questionBank, setQuestionBank] = useState<QuestionBank>(FULL_QUESTION_BANK);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    totalQuestions: 11,
    mcqQuestions: 10,
    openQuestions: 1,
    easyPercent: 10,
    mediumPercent: 70,
    hardPercent: 20,
  });

  const [generatedExam, setGeneratedExam] = useState<GeneratedExamQuestion[]>([]);
  const [message, setMessage] = useState('');

  // Load questions from Supabase or localStorage fallback
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        if (useSupabase) {
          // Try to load from Supabase
          const dbQuestions = await listQuestions();
          
          // Separate MCQ and Open questions
          const mcqQuestions: QuestionMCQ[] = [];
          const openQuestions: QuestionOpen[] = [];
          
          dbQuestions.forEach(q => {
            if (q.isOpen) {
              openQuestions.push(q as QuestionOpen);
            } else {
              mcqQuestions.push(q as QuestionMCQ);
            }
          });
          
          setQuestionBank({
            questions: [...FULL_QUESTION_BANK.questions, ...mcqQuestions],
            openEndedQuestions: [...FULL_QUESTION_BANK.openEndedQuestions, ...openQuestions],
          });
        } else if (isDev) {
          // Fallback to localStorage in dev mode only
          const added = localStorage.getItem('addedQuestions');
          if (added) {
            const addedBank: QuestionBank = JSON.parse(added);
            setQuestionBank({
              questions: [...FULL_QUESTION_BANK.questions, ...addedBank.questions],
              openEndedQuestions: [...FULL_QUESTION_BANK.openEndedQuestions, ...addedBank.openEndedQuestions],
            });
          }
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to localStorage in dev mode on error
        if (isDev) {
          const added = localStorage.getItem('addedQuestions');
          if (added) {
            const addedBank: QuestionBank = JSON.parse(added);
            setQuestionBank({
              questions: [...FULL_QUESTION_BANK.questions, ...addedBank.questions],
              openEndedQuestions: [...FULL_QUESTION_BANK.openEndedQuestions, ...addedBank.openEndedQuestions],
            });
          }
        }
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    
    loadQuestions();
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (useSupabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const hasSession = !!session;
        setAuthenticatedToSupabase(hasSession);
        setIsLoggedIn(hasSession);
      } else {
        // Fallback to localStorage in dev mode
        const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedInStatus);
        setAuthenticatedToSupabase(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    if (useSupabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const hasSession = !!session;
        setAuthenticatedToSupabase(hasSession);
        setIsLoggedIn(hasSession);
      });
      
      return () => subscription.unsubscribe();
    }
  }, []);

  // Load exam config from localStorage (stays local)
  useEffect(() => {
    const savedConfig = localStorage.getItem('examConfig');
    if (savedConfig) {
      setExamConfig(JSON.parse(savedConfig));
    }
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleLogin = async (password: string) => {
    // Allow login if already authenticated to Supabase
    if (authenticatedToSupabase) {
      setIsLoggedIn(true);
      setLoginError('');
      return;
    }

    if (useSupabase) {
      // Use Supabase Auth (email/password or magic link)
      // For now, we'll keep the simple password check but use session
      // TODO: Implement proper Supabase Auth
      try {
        // This is a placeholder - you should implement proper auth
        // For now, we'll use a simple check and create a session indicator
        const storedPassword = localStorage.getItem('examPassword') || '1234';
        if (password === storedPassword) {
          setIsLoggedIn(true);
          setLoginError('');
        } else {
          setLoginError('סיסמה שגויה. נסה שוב.');
        }
      } catch (error) {
        console.error('Login error:', error);
        setLoginError('שגיאה בהתחברות. נסה שוב.');
      }
    } else {
      // Fallback to localStorage in dev mode
      const storedPassword = localStorage.getItem('examPassword') || '1234';
      if (password === storedPassword) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        setLoginError('');
      } else {
        setLoginError('סיסמה שגויה. נסה שוב.');
      }
    }
  };

  const handleSupabaseAuthChange = async () => {
    if (useSupabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;
      setAuthenticatedToSupabase(hasSession);
      // If authenticated to Supabase, allow access without password
      if (hasSession) {
        setIsLoggedIn(true);
      }
    }
  };

  const handleLogout = async () => {
    if (useSupabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('isLoggedIn');
    }
    setIsLoggedIn(false);
    setActiveTab('instructor');
  };

  const handlePasswordChange = (newPassword: string) => {
      localStorage.setItem('examPassword', newPassword);
  };

  const handleConfigChange = (newConfig: ExamConfig) => {
    setExamConfig(newConfig);
    localStorage.setItem('examConfig', JSON.stringify(newConfig));
  };
  
  const handleAddQuestion = async (question: QuestionMCQ | QuestionOpen) => {
    try {
      if (useSupabase) {
        // Save to Supabase
        const savedQuestion = await createQuestion(question);
        
        // Update local state
        if (savedQuestion.isOpen) {
          setQuestionBank(prev => ({
            ...prev,
            openEndedQuestions: [...prev.openEndedQuestions, savedQuestion as QuestionOpen],
          }));
        } else {
          setQuestionBank(prev => ({
            ...prev,
            questions: [...prev.questions, savedQuestion as QuestionMCQ],
          }));
        }
      } else if (isDev) {
        // Fallback to localStorage in dev mode
        const currentAddedBank: QuestionBank = JSON.parse(localStorage.getItem('addedQuestions') || '{"questions":[], "openEndedQuestions":[]}');
        if (question.isOpen) {
          currentAddedBank.openEndedQuestions.push(question);
        } else {
          currentAddedBank.questions.push(question as QuestionMCQ);
        }
        localStorage.setItem('addedQuestions', JSON.stringify(currentAddedBank));
        setQuestionBank({
          questions: [...FULL_QUESTION_BANK.questions, ...currentAddedBank.questions],
          openEndedQuestions: [...FULL_QUESTION_BANK.openEndedQuestions, ...currentAddedBank.openEndedQuestions],
        });
      }
    } catch (error) {
      console.error('Error adding question:', error);
      showMessage('שגיאה בהוספת השאלה. נסה שוב.');
    }
  }

  const handleGenerateExam = useCallback(() => {
    const { totalQuestions, mcqQuestions, openQuestions, easyPercent, mediumPercent, hardPercent } = examConfig;

    if (mcqQuestions + openQuestions !== totalQuestions) {
      showMessage('שגיאה: סך השאלות (שאלות רב ברירה + פתוחות) אינו תואם לסך הכל.');
      return;
    }
    if (easyPercent + mediumPercent + hardPercent !== 100) {
      showMessage('שגיאה: סך אחוזי רמות הקושי חייב להיות 100%.');
      return;
    }
    
    // Categorize questions by difficulty
    const easyQs = questionBank.questions.filter(q => ['Remember', 'Understand'].includes(q.bloom_level));
    const mediumQs = questionBank.questions.filter(q => ['Apply', 'Analyze'].includes(q.bloom_level));
    const hardQs = questionBank.questions.filter(q => ['Evaluate', 'Create'].includes(q.bloom_level));

    // Calculate number of questions per difficulty
    let numEasy = Math.floor(mcqQuestions * (easyPercent / 100));
    let numMedium = Math.floor(mcqQuestions * (mediumPercent / 100));
    let numHard = Math.floor(mcqQuestions * (hardPercent / 100));

    // Distribute remainder due to flooring
    let remainder = mcqQuestions - (numEasy + numMedium + numHard);
    while(remainder > 0) {
        numMedium++; // Add remainders to medium difficulty
        remainder--;
    }

    if (easyQs.length < numEasy || mediumQs.length < numMedium || hardQs.length < numHard) {
        showMessage('שגיאה: אין מספיק שאלות שאלות רב ברירה במאגר עבור רמות הקושי שהוגדרו.');
        return;
    }
    if(questionBank.openEndedQuestions.length < openQuestions) {
        showMessage('שגיאה: אין מספיק שאלות פתוחות במאגר.');
        return;
    }

    // Select questions
    const selectedMCQs = [
      ...shuffleArray(easyQs).slice(0, numEasy),
      ...shuffleArray(mediumQs).slice(0, numMedium),
      ...shuffleArray(hardQs).slice(0, numHard),
    ];
    
    const selectedOpen = shuffleArray(questionBank.openEndedQuestions).slice(0, openQuestions);

    const fullExam: Question[] = shuffleArray([...selectedMCQs, ...selectedOpen]);
    
    // Prepare exam for student view (e.g., shuffle options)
    const processedExam: GeneratedExamQuestion[] = fullExam.map((q: Question): GeneratedExamQuestion => {
      // Use 'in' operator for type guarding, as 'isOpen' is not a reliable
      // discriminator for objects retrieved from localStorage.
      if ('options' in q) {
        // q is safely narrowed to QuestionMCQ
        return { ...q, shuffledOptions: shuffleArray(q.options) };
      } else {
        // q is safely narrowed to QuestionOpen
        return q;
      }
    });

    setGeneratedExam(processedExam);
    setActiveTab('student');
    showMessage('שאלון חדש נוצר בהצלחה!');

  }, [examConfig, questionBank]);

  const handleExamReset = () => {
      setGeneratedExam([]);
      setActiveTab('instructor');
  }

  const TabButton: React.FC<{ tabName: 'instructor' | 'student', label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 py-4 px-6 text-center font-bold text-lg transition-colors focus:outline-none ${
        activeTab === tabName
          ? 'bg-white text-indigo-600 border-b-4 border-indigo-600'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      }`}
    >
      {tabName === 'instructor' ? '👩‍🏫 מרצה' : '🧑‍🎓 סטודנט'}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto max-w-7xl p-2 sm:p-4">
        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-r-lg shadow-md" role="alert">
            <p className="font-bold">{message}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          
          <div className="flex">
            <TabButton tabName="instructor" label="מרצה" />
            <TabButton tabName="student" label="סטודנט" />
          </div>

          <main>
            {activeTab === 'instructor' && (
              <InstructorView
                isLoggedIn={isLoggedIn}
                authenticatedToSupabase={authenticatedToSupabase}
                onLogin={handleLogin}
                onPasswordChange={handlePasswordChange}
                examConfig={examConfig}
                onConfigChange={handleConfigChange}
                questionBank={questionBank}
                onAddQuestion={handleAddQuestion}
                onGenerateExam={handleGenerateExam}
                loginError={loginError}
                onSupabaseAuthChange={handleSupabaseAuthChange}
              />
            )}
            {activeTab === 'student' && <StudentView exam={generatedExam} onExamReset={handleExamReset} />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
