import { supabase } from './client';
import { User } from '@/types';

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string, isAdmin: boolean = false): Promise<{ user: User | null; error: string | null }> {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create user' };
    }

    // We need to handle the user profile creation differently due to RLS
    // Option 1: Use service role key or bypassing RLS in admin function
    // Option 2: Create a special function to handle this or disable RLS temporarily

    // For now, we'll return the user as it is and handle profiles separately
    // This is a simpler approach that works for immediate authentication
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        // Default to regular user, we'll update this on successful login
        role: 'user',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to sign in' };
    }

    // Check if user profile exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      // If the profile doesn't exist, create it now
      if (userError.code === 'PGRST116') {
        // Create the user profile with the role
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: 'user', // Default to regular user
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return { user: null, error: 'Error creating user profile' };
        }

        return {
          user: {
            id: newUserData.id,
            email: newUserData.email,
            role: newUserData.role as 'admin' | 'user',
          },
          error: null,
        };
      }

      return { user: null, error: userError.message };
    }

    // Return the user with the appropriate role
    return {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role as 'admin' | 'user',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Check if there's a valid session
 */
export async function hasValidSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error && data.session !== null;
  } catch (err) {
    console.error('Error checking session:', err);
    return false;
  }
}

/**
 * Get the current authenticated user with role information
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if we have a valid session first
    const hasSession = await hasValidSession();
    if (!hasSession) {
      console.log('No valid session found');
      return { user: null, error: null }; // Not an error, just no session
    }
    
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: null }; // No error, just no user (not authenticated)
    }

    // Get the user profile with role information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      return { user: null, error: userError.message };
    }

    // If no user record found, create one
    if (!userData) {
      try {
        // Create the user profile
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: 'user', // Default to regular user
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return { user: null, error: 'Error creating user profile' };
        }

        return {
          user: {
            id: newUserData.id,
            email: newUserData.email,
            role: newUserData.role as 'admin' | 'user',
          },
          error: null,
        };
      } catch (insertErr) {
        console.error('Error during user insertion:', insertErr);
        return { user: null, error: 'Failed to create user profile' };
      }
    }

    // Return the user with the appropriate role
    return {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role as 'admin' | 'user',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
} 