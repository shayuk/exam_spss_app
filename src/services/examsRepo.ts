import { supabase } from '../lib/supabaseClient';
import type { ExamConfig, GeneratedExamQuestion, Question } from '../../types';
import { fromDbRow, type DBQuestionRow } from './questionsRepo';

// Local types for exam management (Gate 3)
export interface Exam {
  id: string;
  created_by: string;
  title: string | null;
  criteria: Record<string, any> | null;
  created_at: string;
}

export interface ExamItem {
  id: string;
  exam_id: string;
  question_id: string;
  order_index: number;
}

/**
 * Generates a stable default exam title in format "מבחן YYYY-MM-DD"
 * @returns Default title string
 */
function generateDefaultExamTitle(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `מבחן ${year}-${month}-${day}`;
}

/**
 * Creates a new exam in the database
 * @param title - Exam title (optional)
 * @param criteria - Original ExamConfig (stored as JSONB)
 * @returns Created Exam
 */
export async function createExam(
  title?: string | null,
  criteria: ExamConfig
): Promise<Exam> {
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User must be authenticated to create exams');
  }

  // Fetch user's role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw new Error(`Failed to fetch user profile: ${profileError.message}`);
  }

  // Check if user has instructor role
  if (profile?.role !== 'instructor') {
    throw new Error('Forbidden: instructor role required');
  }

  // Generate safe title: use provided title if valid, otherwise use default
  const defaultTitle = generateDefaultExamTitle();
  const safeTitle = (title && title.trim()) ? title.trim() : defaultTitle;

  const { data, error } = await supabase
    .from('exams')
    .insert({
      created_by: session.user.id,
      title: safeTitle,
      criteria: criteria,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating exam:', error);
    throw error;
  }

  return data as Exam;
}

/**
 * Creates exam items (exam_items) for an existing exam
 * @param examId - Exam ID
 * @param questionIds - Array of question_id in the desired order
 * @returns Array of created ExamItem
 */
export async function createExamItems(
  examId: string,
  questionIds: string[]
): Promise<ExamItem[]> {
  if (questionIds.length === 0) {
    return [];
  }

  // Create exam_items with order_index starting from 1
  const itemsToInsert = questionIds.map((questionId, index) => ({
    exam_id: examId,
    question_id: questionId,
    order_index: index + 1,
  }));

  const { data, error } = await supabase
    .from('exam_items')
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('Error creating exam items:', error);
    throw error;
  }

  return data as ExamItem[];
}

/**
 * Deletes an exam from the database
 * Note: Relies on RLS policy (created_by = auth.uid()) and FK CASCADE for exam_items
 * @param examId - Exam ID to delete
 * @returns void
 * @throws Error if deletion fails (e.g., RLS policy violation, FK constraint)
 */
export async function deleteExam(examId: string): Promise<void> {
  const { error, data } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)
    .select();

  if (error) {
    // Enhanced error message for common failure cases
    if (error.code === '42501' || error.message?.includes('policy')) {
      console.error('Error deleting exam: RLS policy violation. User may not have permission to delete this exam.', error);
      throw new Error(`Cannot delete exam: Permission denied. This exam may belong to another user.`);
    } else if (error.code === '23503' || error.message?.includes('foreign key')) {
      console.error('Error deleting exam: Foreign key constraint violation. Ensure exam_items have ON DELETE CASCADE.', error);
      throw new Error(`Cannot delete exam: Foreign key constraint. Please verify database schema has CASCADE configured.`);
    }
    console.error('Error deleting exam:', error);
    throw error;
  }

  // If no rows were deleted, the exam may not exist or user lacks permission
  if (!data || data.length === 0) {
    console.warn(`No exam deleted for ID: ${examId}. Exam may not exist or user lacks permission.`);
    // Don't throw - cleanup should be idempotent
  }
}

/**
 * Gets all exam items for a specific exam
 * @param examId - Exam ID
 * @returns Array of ExamItem ordered by order_index
 */
export async function getExamItems(examId: string): Promise<ExamItem[]> {
  const { data, error } = await supabase
    .from('exam_items')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching exam items:', error);
    throw error;
  }

  return (data || []) as ExamItem[];
}

/**
 * Replaces a question in an exam item
 * Updates only the question_id field
 * @param examItemId - Exam item ID to update
 * @param newQuestionId - New question ID to assign
 * @returns Updated ExamItem
 */
export async function replaceExamItem(
  examItemId: string,
  newQuestionId: string
): Promise<ExamItem> {
  const { data, error } = await supabase
    .from('exam_items')
    .update({ question_id: newQuestionId })
    .eq('id', examItemId)
    .select()
    .single();

  if (error) {
    console.error('Error replacing exam item:', error);
    throw error;
  }

  return data as ExamItem;
}

/**
 * Gets an exam with all its items and question details
 * Returns exam data with exam_items ordered by order_index, including joined question_bank fields
 * @param examId - Exam ID
 * @returns Object with exam and items (items include question details)
 */
export async function getExamWithItems(examId: string): Promise<{
  exam: Exam;
  items: Array<ExamItem & { question: Question }>;
}> {
  // Fetch exam
  const { data: examData, error: examError } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (examError || !examData) {
    console.error('Error fetching exam:', examError);
    throw examError || new Error('Exam not found');
  }

  const exam = examData as Exam;

  // Fetch exam items ordered by order_index
  const { data: itemsData, error: itemsError } = await supabase
    .from('exam_items')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });

  if (itemsError) {
    console.error('Error fetching exam items:', itemsError);
    throw itemsError;
  }

  const examItems = (itemsData || []) as ExamItem[];

  // Fetch questions for each exam item
  const questionIds = examItems.map(item => item.question_id);
  
  if (questionIds.length === 0) {
    return {
      exam,
      items: examItems.map(item => ({ ...item, question: null as any })),
    };
  }

  const { data: questionsData, error: questionsError } = await supabase
    .from('question_bank')
    .select('*')
    .in('id', questionIds);

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    throw questionsError;
  }

  const questionsMap = new Map<string, Question>();
  (questionsData || []).forEach((row: DBQuestionRow) => {
    const question = fromDbRow(row);
    questionsMap.set(row.id, question);
  });

  // Combine items with questions
  const itemsWithQuestions = examItems.map(item => ({
    ...item,
    question: questionsMap.get(item.question_id) || null as any,
  }));

  return {
    exam,
    items: itemsWithQuestions,
  };
}

/**
 * Deletes an exam item and resequences order_index to be continuous (1..N)
 * @param examItemId - Exam item ID to delete
 * @param examId - Exam ID (needed for resequencing)
 * @returns void
 */
export async function deleteExamItem(
  examItemId: string,
  examId: string
): Promise<void> {
  // First, get the order_index of the item to delete
  const { data: itemToDelete, error: fetchError } = await supabase
    .from('exam_items')
    .select('order_index')
    .eq('id', examItemId)
    .single();

  if (fetchError) {
    console.error('Error fetching exam item to delete:', fetchError);
    throw fetchError;
  }

  if (!itemToDelete) {
    throw new Error('Exam item not found');
  }

  const deletedOrderIndex = itemToDelete.order_index;

  // Delete the exam item
  const { error: deleteError } = await supabase
    .from('exam_items')
    .delete()
    .eq('id', examItemId);

  if (deleteError) {
    console.error('Error deleting exam item:', deleteError);
    throw deleteError;
  }

  // Get all remaining items with order_index > deletedOrderIndex
  const { data: itemsToResequence, error: fetchResequenceError } = await supabase
    .from('exam_items')
    .select('id, order_index')
    .eq('exam_id', examId)
    .gt('order_index', deletedOrderIndex)
    .order('order_index', { ascending: true });

  if (fetchResequenceError) {
    console.error('Error fetching items for resequencing:', fetchResequenceError);
    // Item is deleted, but resequencing failed - log and continue
    return;
  }

  // Resequence: update each item to decrease order_index by 1
  if (itemsToResequence && itemsToResequence.length > 0) {
    const updates = itemsToResequence.map(item => ({
      id: item.id,
      order_index: item.order_index - 1,
    }));

    // Update each item individually (Supabase doesn't support batch updates easily)
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('exam_items')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Error resequencing exam item ${update.id}:`, updateError);
        // Continue with other updates even if one fails
      }
    }
  }
}