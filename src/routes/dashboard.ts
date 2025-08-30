import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .use(authMiddleware)
  .get('/stats', async (ctx) => {
    const { user } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Get total flipbooks count
    const { count: totalFlipbooks } = await supabase
      .from('flipbooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get published flipbooks count
    const { count: publishedFlipbooks } = await supabase
      .from('flipbooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_published', true);

    return {
      totalFlipbooks: totalFlipbooks || 0,
      publishedFlipbooks: publishedFlipbooks || 0,
      unpublishedFlipbooks: (totalFlipbooks || 0) - (publishedFlipbooks || 0)
    };
  });