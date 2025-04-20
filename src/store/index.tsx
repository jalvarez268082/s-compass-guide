import { supabase } from '@/integrations/supabase/client';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // Sign up a new user
  const signup = async (email: string, password: string, isAdmin: boolean = false): Promise<{ success: boolean; error: string | null }> => {
    const { user, error } = await signUp(email, password, isAdmin);
    
    if (error || !user) {
      return { success: false, error: error || 'Failed to sign up' };
    }
    
    // After sign up, we need to set the admin role if requested
    if (isAdmin) {
      try {
        // Use RPC or server-side function to set admin role
        // This requires a separate server function with admin privileges
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error setting admin role:', updateError);
          // Continue since the user is created, but log the error
        }
      } catch (error) {
        console.error('Error in admin role update:', error);
      }
    }
    
    return { success: true, error: null };
  };
  
  const value = {
    signup,
  };
}; 