import { exec, ExecOptions, spawn, SpawnOptions } from 'child_process';

import { Emitter, emitter } from './emitter';

export type ProcessOptions = (ExecOptions | SpawnOptions) & { args?: string[] }

export interface Process<
  T extends ExecOptions | SpawnOptions = ExecOptions | SpawnOptions
> {
  cmd: string
  opts: T
  pid: number

  data?: string
  error?: string

  observer: Emitter<ProcessEvents>

  send?: (line: string, terminator?: string, timeout?: number) => Promise<string>
  stop?: () => void
}

export interface ProcessEvents {
  start: null
  data: any
  error: string
  exit: number
}

/** One-off run using exec: (seperate shell!) */
export const run = (
  cmd: string,
  opts: ExecOptions = {}
): Promise<string> => new Promise((resolve, reject) => {
  const proc = exec(cmd, opts, (err, stdout, stderr) => {
    if (err) { reject(err); }
    else if (stderr) { reject(new Error(stderr)); }
    else { resolve(stdout); }
  });

  if ((proc.pid ?? null) === null) {
    throw new Error(`[${proc.pid ?? null}] No PID`);
  }
});

/** Start interactive process using spawn */
export function start (cmdLine: string, opts: SpawnOptions = {}): Process {
  const [ cmd, ...args ] = cmdLine.split(' ');

  const observer = emitter<ProcessEvents>();
  const proc = spawn(cmd, args?.length ? args : [], opts);

  const process: Process = {
    cmd,
    opts,
    pid: proc.pid,
    // proc,
    data: '',
    error: '',
    observer
  }

  proc.on('spawn', () => {
    if ((proc.pid ?? null) === null) {
      try { proc.kill(); } catch(e) {};
      throw new Error('No PID');
    }
    process.pid = proc.pid;

    observer.emit('start', null);
  });

  proc.stdout.on('data', (stream: Buffer) => {
    const data = stream.toString();
    process.data += data;

    observer.emit('data', data);
  });

  proc.stderr.on('data', (stream: Buffer) => {
    const error = stream.toString();
    process.error  += error;
    
    observer.emit('error', error);
  });

  proc.on('error', err => {
    const error = err.message;
    process.error += error;

    observer.emit('error', error);
  });

  proc.on('close', code => {
    proc.removeAllListeners();
    observer.emit('exit', code);
  });

  process.send = (
    line,
    terminator = 'DONE',
    timeout_ms = 0
  ) => new Promise((resolve, reject) => {
    const toWrite = line + '\n';
    let stdout = '';

    function onData (buf: Buffer) {
      const str = buf.toString();
      stdout += str;

      if (str.indexOf(terminator) >= 0) {
        clearHandlers();
        resolve(stdout);
      } else if (str.toLowerCase().indexOf('error') > 0) {
        clearHandlers();
        reject(new Error(str));
      }
    };

    function onError (e: Error) {
      clearHandlers();
      reject(e);
    }

    function clearHandlers () {
      proc.stdout.off('data', onData);
      proc.stdout.off('error', onError);
    }

    proc.stdout.on('data', onData);
    proc.stdout.on('error', onError);

    if (timeout_ms > 0) {
      setTimeout(() => {
        clearHandlers();
        reject(new Error('TIMEOUT'));
      }, timeout_ms);
    }

    proc.on('error', onError);

    proc.stdin.cork();
    proc.stdin.write(toWrite);
    proc.stdin.uncork();
  });
  process.stop = () => proc.kill();

  return process;
}
