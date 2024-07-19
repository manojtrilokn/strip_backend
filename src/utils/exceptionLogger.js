const { createLogger, transports, format } = require('winston');
const fs = require('fs');

class LimitedFileTransport extends transports.File {
  constructor(options) {
    super(options);
    this.maxEntries = options.maxEntries || 5;
    this.logQueue = [];
  }

  log(info, callback) {
    this.logQueue.push(info);
    if (this.logQueue.length > this.maxEntries) {
      this.logQueue.shift();
    }
    fs.writeFile(this.filename, this.logQueue.map(entry => JSON.stringify(entry)).join('\n') + '\n', { flag: 'w' }, err => {
      if (err) {
        this.emit('error', err);
      }
    });
    callback();
  }
}

const exceptionLogger = createLogger({
  transports: [
    new LimitedFileTransport({
      filename: 'error.log',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      maxEntries: 5
    })
  ]
});

module.exports = exceptionLogger;