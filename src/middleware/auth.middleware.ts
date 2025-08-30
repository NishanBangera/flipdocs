import { Elysia } from 'elysia';
import { clerk } from '../config/clerk';
import { supabase } from '../config/supabase';
import { verifyToken } from '@clerk/backend';

export const authMiddleware = new Elysia()
  .derive(async ({ headers, set }) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        set.status = 401;
        return { user: null, error: 'No token provided' };
      }

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

      return { user };
    } catch (error) {
      set.status = 401;
      return { user: null, error: 'Authentication failed' };
    }
  });