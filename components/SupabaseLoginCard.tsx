import React, { useState } from 'react';
import { supabase, supabaseConfigStatus } from '../src/lib/supabaseClient';

const useSupabase = supabaseConfigStatus.isConfigured;

interface SupabaseLoginCardProps {
  onAuthChange?: () => void;
  compact?: boolean;
}

const SupabaseLoginCard: React.FC<SupabaseLoginCardProps> = ({ onAuthChange, compact = false }) => {
  const [supabaseEmail, setSupabaseEmail] = useState('');
  const [supabasePassword, setSupabasePassword] = useState('');
  const [supabaseAuthMessage, setSupabaseAuthMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSupabaseLogin = async () => {
    if (!useSupabase) {
      const errorMsg = supabaseConfigStatus.url && supabaseConfigStatus.url.includes('ה-Project-URL')
        ? 'נראה שה-Publishable key הועתק חלקית/מקוצר. יש להעתיק עם כפתור Copy ב-Supabase ולא לסמן ידנית.'
        : 'נראה שה-Publishable key הועתק חלקית/מקוצר. יש להעתיק עם כפתור Copy ב-Supabase ולא לסמן ידנית.';
      setSupabaseAuthMessage({type: 'error', text: errorMsg});
      setTimeout(() => setSupabaseAuthMessage(null), 8000);
      return;
    }

    if (!supabaseEmail.trim() || !supabasePassword.trim()) {
      setSupabaseAuthMessage({type: 'error', text: 'יש למלא email ו-password'});
      setTimeout(() => setSupabaseAuthMessage(null), 3000);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: supabaseEmail.trim(), 
        password: supabasePassword 
      });
      if (error) {
        // Provide more helpful error messages
        let errorText = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorText = 'שגיאת חיבור: בדוק את הגדרות Supabase ב-.env.local';
        } else if (error.message.includes('Invalid login credentials')) {
          errorText = 'פרטי התחברות שגויים: בדוק את ה-email וה-password';
        } else if (error.message.includes('Email not confirmed')) {
          errorText = 'יש לאשר את ה-email לפני ההתחברות';
        }
        setSupabaseAuthMessage({type: 'error', text: errorText});
        setTimeout(() => setSupabaseAuthMessage(null), 5000);
      } else {
        setSupabaseAuthMessage({type: 'success', text: 'התחברות הצליחה!'});
        setTimeout(() => setSupabaseAuthMessage(null), 3000);
        setSupabasePassword('');
        if (onAuthChange) {
          await onAuthChange();
        }
      }
    } catch (error: any) {
      let errorText = error?.message || 'שגיאה בהתחברות';
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        errorText = 'שגיאת חיבור: Supabase לא מוגדר כראוי. עדכן את .env.local עם הערכים האמיתיים מ-Supabase Dashboard';
      }
      setSupabaseAuthMessage({type: 'error', text: errorText});
      setTimeout(() => setSupabaseAuthMessage(null), 8000);
    }
  };

  const handleSupabaseLogout = async () => {
    if (!useSupabase) {
      setSupabaseAuthMessage({type: 'error', text: 'Supabase לא מוגדר'});
      setTimeout(() => setSupabaseAuthMessage(null), 3000);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSupabaseAuthMessage({type: 'error', text: error.message});
        setTimeout(() => setSupabaseAuthMessage(null), 5000);
      } else {
        setSupabaseAuthMessage({type: 'success', text: 'התנתקות הצליחה!'});
        setTimeout(() => setSupabaseAuthMessage(null), 3000);
        if (onAuthChange) {
          await onAuthChange();
        }
      }
    } catch (error: any) {
      setSupabaseAuthMessage({type: 'error', text: error?.message || 'שגיאה בהתנתקות'});
      setTimeout(() => setSupabaseAuthMessage(null), 5000);
    }
  };

  // Warning component for when Supabase is not configured
  const SupabaseWarning = () => (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-yellow-400 text-xl">⚠️</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700 font-semibold">
            Supabase לא מוגדר כראוי
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            עדכן את קובץ <code className="bg-yellow-100 px-1 rounded">.env.local</code> עם הערכים האמיתיים מ-
            <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">
              Supabase Dashboard
            </a>
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY חייבים להיות ערכים אמיתיים (לא placeholders)
          </p>
          <p className="text-xs text-yellow-600 mt-1 font-semibold">
            ⚠️ נראה שה-Publishable key הועתק חלקית/מקוצר. יש להעתיק עם כפתור Copy ב-Supabase ולא לסמן ידנית.
          </p>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <>
        {!useSupabase && <SupabaseWarning />}
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-4">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-4">🔐 Supabase Login (זמני)</h3>
          <div className="space-y-3">
            <input
              type="email"
              value={supabaseEmail}
              onChange={(e) => setSupabaseEmail(e.target.value)}
              placeholder="הכנס email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="password"
              value={supabasePassword}
              onChange={(e) => setSupabasePassword(e.target.value)}
              placeholder="הכנס password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSupabaseLogin}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={handleSupabaseLogout}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
            {supabaseAuthMessage && (
              <div className={`p-3 rounded-lg text-center font-semibold text-sm ${supabaseAuthMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {supabaseAuthMessage.text}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!useSupabase && <SupabaseWarning />}
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">🔐 Supabase Login (זמני)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-600 block mb-1">Email:</label>
            <input
              type="email"
              value={supabaseEmail}
              onChange={(e) => setSupabaseEmail(e.target.value)}
              placeholder="הכנס email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-600 block mb-1">Password:</label>
            <input
              type="password"
              value={supabasePassword}
              onChange={(e) => setSupabasePassword(e.target.value)}
              placeholder="הכנס password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSupabaseLogin}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            Login to Supabase
          </button>
          <button
            onClick={handleSupabaseLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
          </div>
          {supabaseAuthMessage && (
            <div className={`p-3 rounded-lg text-center font-semibold ${supabaseAuthMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {supabaseAuthMessage.text}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SupabaseLoginCard;

