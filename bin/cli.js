const { inspect } = require('util');
const { Transform } = require('stream');
const { format } = require('../lib/debug');

const showFulldate = process.argv.slice(2).indexOf('--full') !== -1;
const showISODate = process.argv.slice(2).indexOf('--iso') !== -1;
const isQuiet = process.argv.slice(2).indexOf('--quiet') !== -1;
const color = process.argv.slice(2).indexOf('--no-color') === -1;

process.stdin.pipe(new Transform({
  transform(entry, enc, callback) {
    const lines = Buffer.from(entry, enc).toString().trim().split('\n');
    const buffer = [];

    lines.map(x => x.trim()).forEach(line => {
      if (line.charAt() === '{' && line.charAt(line.length - 1) === '}') {
        let payload;

        try {
          payload = JSON.parse(line);
        } catch (e) {
          buffer.push(`${line}\n`);
          return;
        }

        const time = payload.time || payload.ts;
        const name = payload.name || payload.ns;
        const level = payload.level;

        delete payload.level;
        delete payload.time;
        delete payload.name;
        delete payload.ts;
        delete payload.ns;

        const label = level.toUpperCase();
        const prefix = level ? (color ? `\u001b[4m${label}\u001b[24m ${name || ''}` : `${label} ${name || ''}`).trim() : name;

        buffer.push(`${format(prefix, payload, time ? new Date(time) : null, {
          showFulldate, showISODate, noColor: !color,
        })}\n`);
      } else if (!isQuiet) {
        buffer.push(`${line}\n`);
      }
    });

    callback(null, buffer.join(''));
  }
})).pipe(process.stdout);
