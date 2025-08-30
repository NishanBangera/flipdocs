import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { clerk } from '../config/clerk';

export const userRoutes = new Elysia({ prefix: '/user' })
  .use(authMiddleware)

  // Get current user's profile
  .get('/me', async (ctx) => {
    const { user } = ctx as any;
    if (!user) return { error: 'Unauthorized' };
    return { data: user };
  })

  // Update current user's profile (name and/or email)
  .put(
    '/me',
    async (ctx) => {
      const { user, body, set } = ctx as any;
      if (!user) return { error: 'Unauthorized' };

      const { name, email } = body as { name?: string; email?: string };

      try {
        // Update in Supabase
        const updates: any = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;

        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          set.status = 400;
          return { error: 'Failed to update user in database' };
        }

        // Update in Clerk (best-effort)
        try {
          const nameParts = (name || '').trim().split(' ');
          const firstName = nameParts.shift() || undefined;
          const lastName = nameParts.length ? nameParts.join(' ') : undefined;
          await clerk.users.updateUser(user.clerk_id || user.id, {
            firstName,
            lastName,
            emailAddress: email,
          } as any);
        } catch (e) {
          // Ignore Clerk errors to avoid blocking local updates
          console.warn('Clerk user update failed:', e);
        }

        return { data: updatedUser };
      } catch (e) {
        set.status = 500;
        return { error: 'Failed to update profile' };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
      }),
    }
  )

  // Change password for current user via Clerk
  .put(
    '/password',
    async (ctx) => {
      const { user, body, set } = ctx as any;
      if (!user) return { error: 'Unauthorized' };

      const { newPassword } = body as { newPassword: string };
      try {
        await clerk.users.updateUser(user.clerk_id || user.id, {
          password: newPassword,
        } as any);
        return { success: true };
      } catch (e) {
        set.status = 400;
        return { error: 'Failed to update password' };
      }
    },
    {
      body: t.Object({
        newPassword: t.String(),
      }),
    }
  );

export default userRoutes;
