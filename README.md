# NodeJS child_process-based process runner

## Usage
- `run`: calls executable; returns stdout or throws stderr after fully done
- `start`: starts a process, allowing to send & listen for data afterwards (useful for bash/ssh, but also live monitoring of long-lasting processes)

Includes a few utilities (typed EventEmitter & colored level-based taglogger)

## Installation
- Make sure NodeJS is installed
- Install dependencies with `npm install`
- Run with `npm run start`
