import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);

  // Join branch room (for branch staff, POS, managers)
  socket.on('join:branch', (branchId: number) => {
    socket.join(`branch:${branchId}`);
    logger.debug(`Socket ${socket.id} joined branch:${branchId}`);
  });

  // Join kitchen room (for KDS)
  socket.on('join:kitchen', (branchId: number) => {
    socket.join(`kitchen:${branchId}`);
    logger.debug(`Socket ${socket.id} joined kitchen:${branchId}`);
  });

  // Join rider room (for individual delivery updates)
  socket.on('join:rider', (riderUserId: number) => {
    socket.join(`rider:${riderUserId}`);
    logger.debug(`Socket ${socket.id} joined rider:${riderUserId}`);
  });

  // Join customer room (for logged-in customer updates)
  socket.on('join:customer', (customerId: number) => {
    socket.join(`customer:${customerId}`);
    logger.debug(`Socket ${socket.id} joined customer:${customerId}`);
  });

  // Join order room (for guest/customer order tracking)
  socket.on('join:order', (orderId: number | string) => {
    socket.join(`order:${orderId}`);
    logger.debug(`Socket ${socket.id} joined order:${orderId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Start listening
server.listen(env.PORT, () => {
  logger.info(`🚀 Restaurant Backend Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📡 Health check available at: http://localhost:${env.PORT}/health`);
  logger.info(`🔗 API Base URL: http://localhost:${env.PORT}/api/v1`);
});

// Graceful Shutdown
const handleShutdown = async (signal: string) => {
  logger.info(`⚠️ Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
