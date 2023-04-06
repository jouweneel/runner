import colors from 'colors';
import dayjs from 'dayjs';
import { start } from 'repl';

import { envIsDev, envString } from '../config';

interface LogLevelDef {
  color: colors.Color
  trace?: boolean
}

const levelNames = <const> [
  'error',
  'warn',
  'log',
  'info',
  'trace',
  'debug'
]

type LogLevel = (typeof levelNames)[number];

const levels: Record<LogLevel,LogLevelDef> = {
  error: { color: colors.red },
  warn: { color: colors.yellow },
  log: { color: colors.green },
  info: { color: colors.cyan },
  trace: { color: colors.cyan, trace: true },
  debug: { color: colors.magenta },
};

const envLevel = envString('LOG_LEVEL') as LogLevel;
const envIdx = levelNames.indexOf(envLevel);

const DEFAULT_IDX = envIdx >= 0 ? envIdx : envIsDev
  ? levelNames.indexOf('debug')
  : levelNames.indexOf('info');

let defaultIdx = DEFAULT_IDX;

/** Helper functions for shared logging function */
const getPrefix = (
  level: LogLevel, tag: string
) => levels[level].color(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')} [${tag}]`
);

// Limits to first line of stack trace when not developing
const getError = (err: Error) => {
  const errorMessage = err?.message?.split('\n')
    .map(l => l.trim())
    .filter(l => !!l)
    .join('; ');

  const stackLines = (err?.stack?.split('\n') || [])
    .map(l => l.trim())
    .filter(l => !!l && l.indexOf('at ') === 0)
    .map(l => l.replace('at ', ''));

  const message = errorMessage + (envIsDev
    ? `${colors.red(`\n  - ${stackLines.join('\n  - ')}`)}`
    : `@ ${colors.red(stackLines[0])}`
  );
  
  return message;
}

export const setLogLevel = (level?: LogLevel) => {
  const levelIdx = levelNames.indexOf(level);
  defaultIdx = levelIdx >= 0 ? levelIdx : DEFAULT_IDX;
}

/** Exported taglogger */
export const taglogger = (
  tag: string, customLevel: LogLevel = levelNames[DEFAULT_IDX]
) => {
  let customIdx = levelNames.indexOf(customLevel);

  // Level changers (setDebug = backwards compatibility)
  const setLevel = (level?: LogLevel) => {
    const levelIdx = levelNames.indexOf(level);
    customIdx = levelIdx >= 0 ? levelIdx : levelNames.indexOf(customLevel);
  };

  const setDebug = (val: boolean) => {
    setLevel(val ? 'debug' : customLevel);
  }

  // Actual logger functions
  const errorFn = (fatal: boolean = false) => (
    error: Error, ...args: any[]
  ) => {
    console.log(getPrefix('error', tag), getError(error), ...args);

    if (fatal) {
      process.exit(1);
    }
  }

  const logFn = (level: LogLevel) => (...args: any[]) => {
    const levelIdx = levelNames.indexOf(level);
    if (levelIdx < 0 ||  levelIdx > customIdx) return;
    
    const { trace } = levels[level];

    if (trace) console.trace(getPrefix(level, tag), ...args);
    else console.log(getPrefix(level, tag), ...args);
  }

  return {
    fatal: errorFn(true),
    error: errorFn(false),
    warn: logFn('warn'),
    log: logFn('log'),
    info: logFn('info'),
    trace: logFn('trace'),
    debug: logFn('debug'),
    setDebug,
    setLevel
  }
}

export const repl = (
  vars: Record<string,any>
) => {
  const r = start('>');

  const defaults = {
    log: setLogLevel
  };

  const replContext = Object.entries({
    ...defaults,
    ...vars,
  }).reduce((ctx, [ key, value ]) => ({
    [key]: { value, configurable: false, enumerable: true },
    ...ctx,
  }), {});

  Object.defineProperties(r.context, replContext);
}
