const mongoose = require('mongoose');
const { LimitedSizeDocument } = require('mongodb/lib/cmap/handshake/client_metadata');

// Fix Jest 30 VM cross-realm `Map` serialization in `mongodb` client_metadata handshake:
if (LimitedSizeDocument && LimitedSizeDocument.prototype) {
  LimitedSizeDocument.prototype.ifItFitsItSits = function (key, value) {
    const plainValue = value instanceof Map ? Object.fromEntries(value) : value;
    this.document.set(key, plainValue);
    return true;
  };
  LimitedSizeDocument.prototype.toObject = function () {
    return Object.fromEntries(this.document);
  };
}

// Ensure Mongoose prototype properties (like `version` and `createConnection`) are own enumerable
// properties so ts-jest's `__importStar` copies them when transforming `@nestjs/mongoose` ESM.
for (const key of [
  'version',
  'createConnection',
  'connect',
  'disconnect',
  'model',
  'Schema',
  'Types',
  'STATES',
  'connection',
  'connections',
  'models',
  'set',
  'get',
  'plugin',
]) {
  if (mongoose[key] !== undefined && !Object.prototype.hasOwnProperty.call(mongoose, key)) {
    const val = mongoose[key];
    Object.defineProperty(mongoose, key, {
      value: typeof val === 'function' && key !== 'Schema' ? val.bind(mongoose) : val,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
}
