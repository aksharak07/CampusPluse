import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseAdminConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(serviceRoleKey) &&
    !supabaseUrl.includes('your-supabase') &&
    !serviceRoleKey.includes('your-supabase')
  );
};

if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn(
    '⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined in server environment. Admin mutations will require service role privileges to bypass RLS and perform INSERTs.'
  );
}

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured()
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Execute Supabase database operations with automatic retry on transient network errors
 * (ECONNRESET, ENOTFOUND, ETIMEDOUT, socket hang up)
 */
export async function withSupabaseRetry<T = any>(
  operation: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: any }>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ data: T | null; error: any }> {
  if (!supabaseAdmin) {
    return { data: null, error: new Error('Supabase admin client is not configured.') };
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(supabaseAdmin);
      if (!result.error) {
        return result;
      }

      // Check if the returned error is a network failure
      const errMsg = (result.error.message || '').toLowerCase();
      const isNetworkErr =
        errMsg.includes('econnreset') ||
        errMsg.includes('enotfound') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('socket');

      if (isNetworkErr && attempt < maxRetries) {
        lastError = result.error;
        console.warn(
          `Supabase network error (attempt ${attempt + 1}/${maxRetries + 1}): ${result.error.message}. Retrying...`
        );
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
        continue;
      }

      return result;
    } catch (err: any) {
      lastError = err;
      const errMsg = (err.message || '').toLowerCase();
      const isNetworkErr =
        errMsg.includes('econnreset') ||
        errMsg.includes('enotfound') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('socket');

      if (isNetworkErr && attempt < maxRetries) {
        console.warn(
          `Supabase connection exception (attempt ${attempt + 1}/${maxRetries + 1}): ${err.message}. Retrying...`
        );
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
        continue;
      }

      return { data: null, error: err };
    }
  }

  return { data: null, error: lastError };
}
