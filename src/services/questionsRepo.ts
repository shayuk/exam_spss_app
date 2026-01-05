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
