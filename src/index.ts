import { taglogger } from './lib/logger';
import { run, start } from './lib/execute';

const logger = taglogger('runner', 'debug');

const script = `cd /home/server/projects/setlist && docker-compose build server && echo '--done--'`;

const shell = start('ssh bytewriters');
shell.observer.onAny((event, data) => {
  logger.debug(event, data);
});

const delay_ms = (ms: number) => new Promise(resolve => setTimeout(() => resolve(null), ms));

(async () => {
  try {
    // Run directly (returns all stdout once done)
    // const stdout = await run(`ssh bytewriters "${script}"`);

    // delay a bit to skip initial ssh welcome message
    await delay_ms(2000);
    const stdout = await shell.send(script, '--done--');

    logger.log(`Remote command stdout:\n`, stdout);

    shell.stop();
  } catch(e) {
    logger.log(`script: `, e?.message || e);
  }  
})();

// Allows typing commands to (remote) shell
// process.stdin.on('data', data => {
//   shell.send(data.toString());
// });

logger.info('Started 🚀');
