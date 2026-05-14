import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Bundle all route files at build time via Vite glob import
const routeModules = import.meta.glob('../src/app/api/**/route.js', { eager: true });

function getHonoPath(filePath: string): string {
  const apiBase = '../src/app/api';
  const relativePath = filePath.replace(apiBase, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) return '';

  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...' ? `:${param}{.+}` : `:${param}`;
    }
    return segment;
  });

  return '/' + transformedParts.join('/');
}

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

for (const [filePath, route] of Object.entries(routeModules)) {
  const honoPath = getHonoPath(filePath);

  for (const method of methods) {
    if ((route as any)[method]) {
      const handler: Handler = async (c) => {
        const params = c.req.param();
        return await (route as any)[method](c.req.raw, { params });
      };

      switch (method.toLowerCase()) {
        case 'get': api.get(honoPath, handler); break;
        case 'post': api.post(honoPath, handler); break;
        case 'put': api.put(honoPath, handler); break;
        case 'delete': api.delete(honoPath, handler); break;
        case 'patch': api.patch(honoPath, handler); break;
      }
    }
  }
}

export { api, API_BASENAME };
