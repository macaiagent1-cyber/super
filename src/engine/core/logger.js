import { DEBUG } from './debug-flags.js';

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  constructor() {
    this.history = [];
    this.maxHistory = 1000;
  }

  _log(level, channel, message, ...args) {
    if (LEVELS[level] < LEVELS[DEBUG.LOG_LEVEL]) return;

    const entry = {
      timestamp: performance.now(),
      level,
      channel,
      message,
      args
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const color = {
      debug: 'gray',
      info: 'skyblue',
      warn: 'orange',
      error: 'red'
    }[level];

    console.log(
      `%c[${channel}] %c[${level}] %c${message}`,
      'font-weight: bold',
      `color: ${color}; font-weight: bold`,
      'color: inherit',
      ...args
    );
  }

  debug(channel, message, ...args) { this._log('debug', channel, message, ...args); }
  info(channel, message, ...args) { this._log('info', channel, message, ...args); }
  warn(channel, message, ...args) { this._log('warn', channel, message, ...args); }
  error(channel, message, ...args) { this._log('error', channel, message, ...args); }
}

export const logger = new Logger();
