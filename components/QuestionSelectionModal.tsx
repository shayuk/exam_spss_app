import React, { useState, useEffect } from 'react';
import type { Question } from '../types';
import { getCandidateQuestions, type CandidateQuestion } from '../src/services/questionsRepo';

interface QuestionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (question: Question) => void;
  currentQuestionId: string;
  examId: string;
  itemIndex: number;
}

const QuestionSelectionModal: React.FC<QuestionSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentQuestionId,
  examId,
  itemIndex,
}) => {
  const [candidates, setCandidates] = useState<CandidateQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterByConfig, setFilterByConfig] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  // Load candidates when modal opens or filters change
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadCandidates = async () => {
      setLoading(true);
      try {
        const results = await getCandidateQuestions(currentQuestionId, examId, {
          filterByConfig,
          allowDuplicates,
          searchText,
        });
        setCandidates(results);
      } catch (error) {
        console.error('Error loading candidate questions:', error);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadCandidates();
    }, searchText ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen, currentQuestionId, examId, filterByConfig, allowDuplicates, searchText]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchText('');
      setFilterByConfig(true);
      setAllowDuplicates(false);
      setCandidates([]);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (question: Question) => {
    onSelect(question);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">בחר שאלה במקום #{itemIndex}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            title="סגור"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                חיפוש שאלה
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="הקלד טקסט לחיפוש..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterByConfig}
                  onChange={(e) => setFilterByConfig(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  הצג רק שאלות שמתאימות להגדרות הבחינה
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  אפשר כפילויות
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">טוען שאלות...</div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchText
                ? 'לא נמצאו שאלות התואמות לחיפוש'
                : 'לא נמצאו שאלות זמינות'}
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((question) => (
                <div
                  key={question.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-800 mb-2">{question.question_text}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          סוג: {question.isOpen ? 'פתוחה' : 'רב ברירה'}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          רמת Bloom: {question.bloom_level}
                        </span>
                        {question.difficulty !== undefined && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            קושי: {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelect(question)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors flex-shrink-0"
                    >
                      בחר
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionModal;

