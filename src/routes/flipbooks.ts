import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth.middleware';
import { FlipbookService } from '../services/flipbook.service';

export const flipbookRoutes = new Elysia({ prefix: '/flipbooks' })
  .use(authMiddleware)
  
  // Get all flipbooks for user
  .get('/', async (ctx) => {
    const { user } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      const flipbooks = await FlipbookService.getAll(user.id);
      return { data: flipbooks };
    } catch (error) {
      return { error: 'Failed to fetch flipbooks' };
    }
  })

  // Get single flipbook by ID
  .get('/:id', async (ctx) => {
    const { user, params } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      const flipbook = await FlipbookService.getById(params.id, user.id);
      if (!flipbook) {
        return { error: 'Flipbook not found' };
      }
      return { data: flipbook };
    } catch (error) {
      return { error: 'Failed to fetch flipbook' };
    }
  })

  // Create new flipbook
  .post('/', async (ctx) => {
    const { user, body } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      const flipbook = await FlipbookService.create(user.id, body);
      return { data: flipbook };
    } catch (error) {
      return { error: 'Failed to create flipbook' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      pdf: t.File(),
      backgroundImage: t.Optional(t.File()),
      isPublished: t.Boolean()
    })
  })

  // Update flipbook
  .put('/:id', async (ctx) => {
    const { user, params, body } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      const flipbook = await FlipbookService.update(params.id, user.id, body);
      return { data: flipbook };
    } catch (error) {
      return { error: 'Failed to update flipbook' };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      pdf: t.Optional(t.File()),
      backgroundImage: t.Optional(t.File()),
      isPublished: t.Optional(t.Boolean())
    })
  })

  // Delete flipbook
  .delete('/:id', async (ctx) => {
    const { user, params } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      await FlipbookService.delete(params.id, user.id);
      return { success: true };
    } catch (error) {
      return { error: 'Failed to delete flipbook' };
    }
  })

  // Toggle publish status
  .patch('/:id/toggle-publish', async (ctx) => {
    const { user, params } = ctx as any;
    
    if (!user) {
      return { error: 'Unauthorized' };
    }

    try {
      const flipbook = await FlipbookService.getById(params.id, user.id);
      if (!flipbook) {
        return { error: 'Flipbook not found' };
      }

      const updated = await FlipbookService.update(params.id, user.id, {
        isPublished: !flipbook.is_published
      });
      
      return { data: updated };
    } catch (error) {
      return { error: 'Failed to toggle publish status' };
    }
  });

// Public route for viewing flipbooks
export const publicFlipbookRoutes = new Elysia({ prefix: '/view' })
  .get('/:slug', async ({ params }) => {
    try {
      const flipbook = await FlipbookService.getBySlug(params.slug);
      
      if (!flipbook) {
        return { error: 'Flipbook not found or not published' };
      }

      return { data: flipbook };
    } catch (error) {
      return { error: 'Failed to fetch flipbook' };
    }
  });