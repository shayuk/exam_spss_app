export interface QuestionMCQ {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  isOpen: false;
  imageData?: string;
}

export interface QuestionOpen {
  id: string;
  question_text: string;
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  isOpen: true;
  imageData?: string;
}

export type Question = QuestionMCQ | QuestionOpen;

export interface ExamConfig {
  totalQuestions: number;
  mcqQuestions: number;
  openQuestions: number;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
}

export interface QuestionBank {
  questions: QuestionMCQ[];
  openEndedQuestions: QuestionOpen[];
}

export type GeneratedExamQuestionMCQ = QuestionMCQ & {
  shuffledOptions: string[];
};

export type GeneratedExamQuestion = GeneratedExamQuestionMCQ | QuestionOpen;