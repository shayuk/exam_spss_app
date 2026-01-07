import { supabase } from '../lib/supabaseClient';

interface TableCheckResult {
  tableName: string;
  success: boolean;
  columns?: string[];
  error?: string;
  errorType?: 'schema' | 'rls' | 'network' | 'auth' | 'unknown';
}

/**
 * DB Reality Check - Validates actual database schema
 * Checks all tables: question_bank, profiles, exams, exam_items, submissions
 */
export async function runDBRealityCheck(): Promise<TableCheckResult[]> {
  const tables = ['question_bank', 'profiles', 'exams', 'exam_items', 'submissions'];
  const results: TableCheckResult[] = [];

  console.log('='.repeat(60));
  console.log('🔍 DB REALITY CHECK - Starting...');
  console.log('='.repeat(60));

  // Print env var names (not values)
  console.log('\n📋 Environment Variables Used:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - VITE_SUPABASE_ANON_KEY');
  console.log('  (Values are loaded from: .env.local or Vercel env vars)');
  console.log('');

  for (const tableName of tables) {
    console.log(`\n🔎 Checking table: ${tableName}`);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        // Determine error type
        let errorType: TableCheckResult['errorType'] = 'unknown';
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('relation') || errorMessage.includes('does not exist') || errorMessage.includes('table')) {
          errorType = 'schema';
        } else if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('rls')) {
          errorType = 'rls';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
          errorType = 'network';
        } else if (errorMessage.includes('auth') || errorMessage.includes('session') || errorMessage.includes('token')) {
          errorType = 'auth';
        }

        results.push({
          tableName,
          success: false,
          error: error.message,
          errorType,
        });

        console.log(`  ❌ FAILED - Error Type: ${errorType}`);
        console.log(`  Error: ${error.message}`);
      } else {
        // Success - extract column names
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        
        results.push({
          tableName,
          success: true,
          columns,
        });

        console.log(`  ✅ SUCCESS`);
        console.log(`  Columns found (${columns.length}):`, columns.join(', '));
        
        if (data && data.length > 0) {
          console.log(`  Sample row keys:`, Object.keys(data[0]));
        } else {
          console.log(`  ⚠️  Table exists but is empty (no rows to inspect)`);
        }
      }
    } catch (err: any) {
      results.push({
        tableName,
        success: false,
        error: err?.message || String(err),
        errorType: 'unknown',
      });

      console.log(`  ❌ FAILED - Exception`);
      console.log(`  Error: ${err?.message || String(err)}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successCount}/${tables.length}`);
  console.log(`❌ Failed: ${failCount}/${tables.length}`);
  
  if (failCount > 0) {
    console.log('\n❌ Failed Tables:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.tableName}: ${r.errorType} - ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  return results;
}

/**
 * Get detailed schema information for a specific table
 */
export async function getTableSchema(tableName: string): Promise<{
  columns: string[];
  sampleRow: any;
  rowCount?: number;
}> {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .limit(1);

  if (error) {
    throw error;
  }

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const sampleRow = data && data.length > 0 ? data[0] : null;

  return {
    columns,
    sampleRow,
    rowCount: count || undefined,
  };
}

