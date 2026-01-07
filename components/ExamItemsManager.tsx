import React, { useState, useEffect } from 'react';
import type { QuestionBank, Question } from '../types';
import { supabase, supabaseConfigStatus } from '../src/lib/supabaseClient';
import { fromDbRow } from '../src/services/questionsRepo';
import { getExamItems, replaceExamItem, deleteExamItem, type ExamItem } from '../src/services/examsRepo';
import QuestionSelectionModal from './QuestionSelectionModal';

const useSupabase = supabaseConfigStatus.isConfigured;

interface ExamItemWithQuestion extends ExamItem {
  question: Question | null;
}

interface ExamItemsManagerProps {
  currentExamId: string | null;
  questionBank: QuestionBank;
  onExamReload: (examId: string) => Promise<void>;
}

const ConfigSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 mb-6">
    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">{title}</h3>
    {children}
  </div>
);

const ExamItemsManager: React.FC<ExamItemsManagerProps> = ({ currentExamId, questionBank, onExamReload }) => {
  const [examItems, setExamItems] = useState<ExamItemWithQuestion[]>([]);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [loadingExamItems, setLoadingExamItems] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [replacementModal, setReplacementModal] = useState<{
    isOpen: boolean;
    examItemId: string;
    currentQuestionId: string;
    itemIndex: number;
  } | null>(null);

  // Load exam items when currentExamId changes
  useEffect(() => {
    const loadExamItems = async () => {
      if (!currentExamId || !useSupabase) {
        setExamItems([]);
        return;
      }

      setLoadingExamItems(true);
      try {
        const items = await getExamItems(currentExamId);
        
        // Fetch questions for each exam item
        const itemsWithQuestions: ExamItemWithQuestion[] = await Promise.all(
          items.map(async (item) => {
            // Try to find question in questionBank first
            const allQuestions = [...questionBank.questions, ...questionBank.openEndedQuestions];
            let question = allQuestions.find(q => q.id === item.question_id) || null;
            
            // If not found in local bank, fetch from DB
            if (!question && useSupabase) {
              try {
                const { data, error } = await supabase
                  .from('question_bank')
                  .select('*')
                  .eq('id', item.question_id)
                  .single();
                
                if (!error && data) {
                  question = fromDbRow(data);
                }
              } catch (err) {
                console.error(`Error fetching question ${item.question_id}:`, err);
              }
            }
            
            return { ...item, question };
          })
        );
        
        setExamItems(itemsWithQuestions);
      } catch (error) {
        console.error('Error loading exam items:', error);
        setMessage({ type: 'error', text: 'שגיאה בטעינת שאלות המבחן' });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setLoadingExamItems(false);
      }
    };

    loadExamItems();
  }, [currentExamId, questionBank]);

  // Lock/Unlock handler (UI-only)
  const handleToggleLock = (examItemId: string) => {
    setLockedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(examItemId)) {
        newSet.delete(examItemId);
      } else {
        newSet.add(examItemId);
      }
      return newSet;
    });
  };

  // Replace handler - opens modal for manual selection
  const handleReplace = (examItemId: string, currentQuestionId: string) => {
    if (!currentExamId || !useSupabase) {
      setMessage({ type: 'error', text: 'לא ניתן להחליף שאלה ללא חיבור ל-Supabase' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (lockedItems.has(examItemId)) {
      return; // Locked items cannot be replaced
    }

    // Find the item index
    const item = examItems.find(i => i.id === examItemId);
    if (!item) {
      return;
    }

    // Open modal
    setReplacementModal({
      isOpen: true,
      examItemId,
      currentQuestionId,
      itemIndex: item.order_index,
    });
  };

  // Handle question selection from modal
  const handleQuestionSelected = async (selectedQuestion: Question) => {
    if (!replacementModal || !currentExamId || !useSupabase) {
      return;
    }

    const { examItemId } = replacementModal;
    setLoadingItems(prev => new Set(prev).add(examItemId));

    try {
      // Replace in database
      await replaceExamItem(examItemId, selectedQuestion.id);

      // Reload exam from database to update both instructor and student views
      if (currentExamId) {
        await onExamReload(currentExamId);
      }

      // Update local state as well (for immediate UI feedback)
      setExamItems(prev => prev.map(item => 
        item.id === examItemId 
          ? { ...item, question: selectedQuestion }
          : item
      ));

      setMessage({ type: 'success', text: 'השאלה הוחלפה בהצלחה' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error replacing question:', error);
      setMessage({ type: 'error', text: 'שגיאה בהחלפת השאלה' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(examItemId);
        return newSet;
      });
      setReplacementModal(null);
    }
  };

  // Delete handler (with resequencing)
  const handleDelete = async (examItemId: string) => {
    if (!currentExamId || !useSupabase) {
      setMessage({ type: 'error', text: 'לא ניתן למחוק שאלה ללא חיבור ל-Supabase' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (lockedItems.has(examItemId)) {
      return; // Locked items cannot be deleted
    }

    setLoadingItems(prev => new Set(prev).add(examItemId));

    try {
      // Delete from database (includes resequencing)
      await deleteExamItem(examItemId, currentExamId);

      // Reload exam from database to update both instructor and student views
      await onExamReload(currentExamId);

      // Remove from local state as well (for immediate UI feedback)
      setExamItems(prev => prev.filter(item => item.id !== examItemId));

      // Remove from locks if present
      setLockedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(examItemId);
        return newSet;
      });

      setMessage({ type: 'success', text: 'השאלה נמחקה בהצלחה' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting question:', error);
      setMessage({ type: 'error', text: 'שגיאה במחיקת השאלה' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(examItemId);
        return newSet;
      });
    }
  };

  if (!currentExamId || !useSupabase) {
    return null;
  }

  return (
    <>
      {message && (
        <div className={`p-4 mb-4 rounded-lg text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      {replacementModal && (
        <QuestionSelectionModal
          isOpen={replacementModal.isOpen}
          onClose={() => setReplacementModal(null)}
          onSelect={handleQuestionSelected}
          currentQuestionId={replacementModal.currentQuestionId}
          examId={currentExamId!}
          itemIndex={replacementModal.itemIndex}
        />
      )}
      <ConfigSection title="📝 ניהול שאלות המבחן הנוכחי">
        {loadingExamItems ? (
          <div className="text-center py-8 text-gray-500">טוען שאלות...</div>
        ) : examItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">אין שאלות במבחן זה</div>
        ) : (
          <div className="space-y-4">
            {examItems.map((item) => {
              const isLocked = lockedItems.has(item.id);
              const isLoading = loadingItems.has(item.id);
              const question = item.question;

              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-lg border-2 ${
                    isLocked ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-indigo-600">#{item.order_index}</span>
                        {isLocked && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            🔒 נעול
                          </span>
                        )}
                        {isLoading && (
                          <span className="text-xs text-gray-500">⏳ מעבד...</span>
                        )}
                      </div>
                      {question ? (
                        <div>
                          <p className="text-gray-800 mb-2">{question.question_text}</p>
                          <div className="text-sm text-gray-500">
                            <span>סוג: {question.isOpen ? 'פתוחה' : 'רב ברירה'}</span>
                            {' • '}
                            <span>רמת Bloom: {question.bloom_level}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">שאלה לא נמצאה (ID: {item.question_id})</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleLock(item.id)}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          isLocked
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isLocked ? 'נעול' : 'פתוח'}
                      >
                        {isLocked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() => question && handleReplace(item.id, question.id)}
                        disabled={isLocked || isLoading || !question}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          isLocked || !question
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="החלף שאלה"
                      >
                        🔄 החלף
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isLocked || isLoading}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          isLocked
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="מחק שאלה"
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ConfigSection>
    </>
  );
};

export default ExamItemsManager;


