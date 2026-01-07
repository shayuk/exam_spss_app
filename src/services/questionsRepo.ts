import { supabase } from '../lib/supabaseClient';
import type { QuestionMCQ, QuestionOpen, Question } from '../../types';

// Database schema type (matches Supabase table)
export interface DBQuestionRow {
  id: string;
  created_by: string;
  type: 'mcq' | 'open';
  topic: string | null;
  difficulty: number; // 1-5
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  question_text: string;
  choices: unknown[] | null; // jsonb array for MCQ options (can be string[] or {id, text}[])
  correct_answer: string | null; // text answer (for MCQ: the option text, for open: null)
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

// App Question type (UI model) - using existing Question type from types.ts
export type AppQuestion = Question;

// Convert DB row to app Question type
export const fromDbRow = (row: DBQuestionRow): AppQuestion => {
  if (row.type === 'open') {
    return {
      id: row.id,
      question_text: row.question_text,
      bloom_level: row.bloom_level,
      isOpen: true,
      imageData: undefined, // image_data not in DB schema
    } as QuestionOpen;
  } else {
    // MCQ type
    const choicesRaw = row.choices || [];
    // Convert choices to string[] - handle both string[] and {id, text}[] formats
    const choices: string[] = choicesRaw.map((choice: unknown) => {
      if (typeof choice === 'string') {
        return choice;
      } else if (typeof choice === 'object' && choice !== null && 'text' in choice) {
        return (choice as { text: string }).text;
      } else if (typeof choice === 'object' && choice !== null && 'id' in choice && 'text' in choice) {
        return (choice as { id: string; text: string }).text;
      }
      return String(choice);
    });
    
    // Find the index of correct_answer in choices array
    const correctAnswerIndex = row.correct_answer 
      ? choices.findIndex(choice => choice === row.correct_answer)
      : 0;
    
    return {
      id: row.id,
      question_text: row.question_text,
      options: choices,
      correct_answer_index: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      bloom_level: row.bloom_level,
      isOpen: false,
      imageData: undefined, // image_data not in DB schema
    } as QuestionMCQ;
  }
};

// Convert app Question to DB row
export const toDbRow = async (question: AppQuestion, includeCreatedBy: boolean = false): Promise<Partial<DBQuestionRow>> => {
  const baseRow: Partial<DBQuestionRow> = {
    question_text: question.question_text,
    type: question.isOpen ? 'open' : 'mcq',
    bloom_level: (question.bloom_level ?? 'Remember'),
    difficulty: 2, // Default value
    topic: null, // Not in AppQuestion model
    explanation: null, // Not in AppQuestion model
  };

  if (question.isOpen) {
    const q = question as QuestionOpen;
    baseRow.choices = null;
    baseRow.correct_answer = null;
  } else {
    const q = question as QuestionMCQ;
    baseRow.choices = q.options;
    // Get the correct answer text from options array
    baseRow.correct_answer = q.options[q.correct_answer_index] || null;
  }

  // Include created_by if requested (for insert operations)
  if (includeCreatedBy) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be authenticated to create questions');
    }
    baseRow.created_by = session.user.id;
  }

  return baseRow;
};

/**
 * List all questions from the database
 */
export const listQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  return (data || []).map(fromDbRow);
};

/**
 * Create a new question in the database
 */
export const createQuestion = async (question: Question): Promise<Question> => {
  const row = await toDbRow(question, true); // Include created_by
  
  const { data, error } = await supabase
    .from('question_bank')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating question:', error);
    throw error;
  }

  return fromDbRow(data);
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  id: string,
  patch: Partial<Question>
): Promise<Question> => {
  // Build update data from patch
  const updateData: Partial<DBQuestionRow> = {};
  
  if (patch.question_text !== undefined) {
    updateData.question_text = patch.question_text;
  }
  
  if (patch.bloom_level !== undefined) {
    updateData.bloom_level = patch.bloom_level;
  }
  
  // Handle isOpen changes
  if (patch.isOpen === true) {
    updateData.type = 'open';
    updateData.choices = null;
    updateData.correct_answer = null;
  } else if (patch.isOpen === false) {
    updateData.type = 'mcq';
  }
  
  // Handle options update
  if ('options' in patch && patch.options !== undefined) {
    updateData.choices = patch.options;
  }
  
  // Handle correct_answer_index update (only if options are provided)
  if ('correct_answer_index' in patch && patch.correct_answer_index !== undefined) {
    const mcqPatch = patch as Partial<QuestionMCQ>;
    // Only update correct_answer if options are provided in the patch
    if (mcqPatch.options && mcqPatch.options.length > 0 && 
        mcqPatch.correct_answer_index >= 0 && 
        mcqPatch.correct_answer_index < mcqPatch.options.length) {
      updateData.correct_answer = mcqPatch.options[mcqPatch.correct_answer_index] || null;
    }
  }

  const { data, error } = await supabase
    .from('question_bank')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating question:', error);
    throw error;
  }

  return fromDbRow(data);
};

/**
 * Delete a question from the database
 */
export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('question_bank')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

/**
 * Finds a replacement question matching the same slot (type/topic/difficulty)
 * Excludes questions already in the exam
 * @param currentQuestionId - The question ID to replace
 * @param examId - Exam ID to check for duplicates
 * @returns Replacement Question or null if none found
 */
export const findReplacementQuestion = async (
  currentQuestionId: string,
  examId: string
): Promise<Question | null> => {
  // Get the current question to extract its attributes
  const { data: currentQuestion, error: currentError } = await supabase
    .from('question_bank')
    .select('*')
    .eq('id', currentQuestionId)
    .single();

  if (currentError || !currentQuestion) {
    console.error('Error fetching current question:', currentError);
    return null;
  }

  const currentRow = currentQuestion as DBQuestionRow;
  const currentType = currentRow.type;
  const currentTopic = currentRow.topic;
  const currentDifficulty = currentRow.difficulty;

  // Get all question IDs already in this exam (to exclude duplicates)
  const { data: examItems, error: examItemsError } = await supabase
    .from('exam_items')
    .select('question_id')
    .eq('exam_id', examId);

  if (examItemsError) {
    console.error('Error fetching exam items:', examItemsError);
    return null;
  }

  const existingQuestionIds = new Set(
    (examItems || []).map((item: { question_id: string }) => item.question_id)
  );

  // Build query to find matching questions
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('type', currentType)
    .neq('id', currentQuestionId); // Exclude the current question itself

  // Match topic if it exists
  if (currentTopic) {
    query = query.eq('topic', currentTopic);
  } else {
    // If current question has no topic, match questions with no topic
    query = query.is('topic', null);
  }

  // Match difficulty
  if (currentDifficulty) {
    query = query.eq('difficulty', currentDifficulty);
  }

  const { data: candidates, error: candidatesError } = await query;

  if (candidatesError) {
    console.error('Error fetching replacement candidates:', candidatesError);
    return null;
  }

  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Filter out questions already in the exam
  const availableCandidates = candidates.filter(
    (q: DBQuestionRow) => !existingQuestionIds.has(q.id)
  );

  if (availableCandidates.length === 0) {
    return null;
  }

  // Return a random replacement
  const randomIndex = Math.floor(Math.random() * availableCandidates.length);
  const selectedCandidate = availableCandidates[randomIndex] as DBQuestionRow;

  return fromDbRow(selectedCandidate);
};

/**
 * Candidate question with metadata (includes difficulty from DB)
 */
export interface CandidateQuestion extends Question {
  difficulty?: number; // From DB, may not exist
}

/**
 * Fetches candidate questions for manual replacement
 * @param currentQuestionId - The question ID being replaced (to exclude it)
 * @param examId - Exam ID to check for duplicates
 * @param options - Filtering options
 * @returns Array of candidate Questions with difficulty metadata
 */
export const getCandidateQuestions = async (
  currentQuestionId: string,
  examId: string,
  options: {
    filterByConfig?: boolean; // Filter by current question's type/bloom_level/difficulty
    allowDuplicates?: boolean; // Allow questions already in exam
    searchText?: string; // Search in question_text
  } = {}
): Promise<CandidateQuestion[]> => {
  const { filterByConfig = true, allowDuplicates = false, searchText = '' } = options;

  // Get the current question to extract its attributes (if filtering by config)
  let currentRow: DBQuestionRow | null = null;
  if (filterByConfig) {
    const { data: currentQuestion, error: currentError } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', currentQuestionId)
      .single();

    if (!currentError && currentQuestion) {
      currentRow = currentQuestion as DBQuestionRow;
    }
  }

  // Get all question IDs already in this exam (to exclude duplicates if needed)
  let existingQuestionIds = new Set<string>();
  if (!allowDuplicates) {
    const { data: examItems, error: examItemsError } = await supabase
      .from('exam_items')
      .select('question_id')
      .eq('exam_id', examId);

    if (!examItemsError && examItems) {
      existingQuestionIds = new Set(
        examItems.map((item: { question_id: string }) => item.question_id)
      );
    }
  }

  // Build query
  let query = supabase
    .from('question_bank')
    .select('*')
    .neq('id', currentQuestionId); // Always exclude the current question itself

  // Apply config filter if requested
  if (filterByConfig && currentRow) {
    query = query.eq('type', currentRow.type);
    
    // Match bloom_level if present
    if (currentRow.bloom_level) {
      query = query.eq('bloom_level', currentRow.bloom_level);
    }
    
    // Match difficulty if present
    if (currentRow.difficulty) {
      query = query.eq('difficulty', currentRow.difficulty);
    }
    
    // Match topic if it exists
    if (currentRow.topic) {
      query = query.eq('topic', currentRow.topic);
    } else {
      // If current question has no topic, match questions with no topic
      query = query.is('topic', null);
    }
  }

  // Apply search filter if provided
  if (searchText.trim()) {
    query = query.ilike('question_text', `%${searchText.trim()}%`);
  }

  const { data: candidates, error: candidatesError } = await query.order('created_at', { ascending: false });

  if (candidatesError) {
    console.error('Error fetching candidate questions:', candidatesError);
    return [];
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Filter out duplicates if not allowed
  const availableCandidates = allowDuplicates
    ? candidates
    : candidates.filter((q: DBQuestionRow) => !existingQuestionIds.has(q.id));

  // Convert to CandidateQuestion with difficulty metadata
  return availableCandidates.map((row: DBQuestionRow) => {
    const question = fromDbRow(row);
    return {
      ...question,
      difficulty: row.difficulty,
    } as CandidateQuestion;
  });
};