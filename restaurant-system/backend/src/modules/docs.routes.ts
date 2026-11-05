import { Router, Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Restaurant Management System API',
    version: '1.0.0',
    description: 'Unified RESTful API for the Multi-App Restaurant Management System (Admin Web, POS, Kitchen Display, Customer Web, Customer Mobile, Staff Mobile).',
  },
  servers: [
    { url: 'http://localhost:5000/api/v1', description: 'Local Development Server' },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Staff authentication login',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'manager@spicegarden.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Authenticated successfully with JWT access and refresh tokens' } },
      },
    },
    '/menu/items': {
      get: {
        summary: 'List menu items with categories and variants',
        tags: ['Menu'],
        responses: { 200: { description: 'Menu items list' } },
      },
    },
    '/tables': {
      get: {
        summary: 'List all dine-in tables with real-time occupancy status',
        tags: ['Tables'],
        responses: { 200: { description: 'Tables list' } },
      },
    },
    '/orders': {
      post: {
        summary: 'Place an order (Dine-in, Takeaway, or Delivery)',
        tags: ['Orders'],
        responses: { 201: { description: 'Order created and emitted to kitchen in real-time' } },
      },
    },
    '/payments': {
      post: {
        summary: 'Process payment (Cash, Card, bKash, Nagad)',
        tags: ['Payments'],
        responses: { 201: { description: 'Payment recorded and order settled' } },
      },
    },
    '/cash-register/current': {
      get: {
        summary: 'Get active cashier drawer session and live cash metrics',
        tags: ['Cash Register'],
        responses: { 200: { description: 'Drawer session metrics' } },
      },
    },
    '/reports/sales': {
      get: {
        summary: 'Get revenue and sales analytics report',
        tags: ['Reports'],
        responses: { 200: { description: 'Sales metrics summary' } },
      },
    },
  },
};

router.get('/spec.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

router.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Restaurant System API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api/docs/spec.json',
              dom_id: '#swagger-ui',
            });
          };
        </script>
      </body>
    </html>
  `);
});

export const docsRoutes = router;
