import { game } from './game.js';
import { logger } from './engine/core/logger.js';

async function bootstrap() {
  try {
    await game.init();
    game.start();
  } catch (err) {
    logger.error('main', 'Failed to bootstrap game', err);
  }
}

bootstrap();
