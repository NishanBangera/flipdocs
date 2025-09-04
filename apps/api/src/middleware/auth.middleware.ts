import { Elysia } from 'elysia';
import { clerk } from '../config/clerk';
import { supabase } from '../config/supabase';
import { verifyToken } from '@clerk/backend';

// Export a plugin function so it can be used with `.use(authMiddleware)`
// This ensures the derive hook is registered onto the app instance passed to .use
export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ headers, set }) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      if (!token) {
        set.status = 401;
        return { user: null, error: 'No token provided' };
      }
      
      console.log('Verifying token with Clerk...');
      
      // Verify the token with Clerk
      const sessionToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!
      });
      
      if (!sessionToken || !sessionToken.sub) {
        set.status = 401;
        return { user: null, error: 'Invalid token' };
      }

      const userId = sessionToken.sub;

      // Get or create user in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', userId)
        .single();

      let user = existingUser;

      if (!existingUser) {
        // Get user info from Clerk
        const clerkUser = await clerk.users.getUser(userId);
        
        // Create user in Supabase
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            clerk_id: userId,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
          })
          .select()
          .single();
          
        user = newUser;
      }
      console.log('Authenticated user:', user);
      return { user };
    } catch (error) {
      console.log('Authentication error:', error);
      set.status = 401;
      return { user: null, error: error };
    }
  });