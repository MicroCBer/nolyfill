// @ts-check
'use strict';

const fsPromises = require('fs/promises');
const path = require('path');
const ezspawn = require('@jsdevtools/ez-spawn');

const currentPackageJson = require('./package.json');

const { compareAndWriteFile } = require('@nolyfill/internal');

const autoGeneratedPackagesList = /** @type {const} */ ([
  ['array-includes', 'Array.prototype.includes', false],
  ['array.prototype.findlastindex', `Array.prototype.findLastIndex || function (callback, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (callback.call(thisArg, this[i], i, this)) return i;
  }
  return -1;
}`, false],
  ['array.prototype.flat', 'Array.prototype.flat', false],
  ['array.prototype.flatmap', 'Array.prototype.flatMap', false],
  ['arraybuffer.prototype.slice', 'ArrayBuffer.prototype.slice', false],
  ['function.prototype.name', 'Function.prototype.name', false],
  ['has', 'Object.prototype.hasOwnProperty', false],
  ['object-keys', 'Object.keys', true],
  ['object.assign', 'Object.assign', true],
  ['object.entries', 'Object.entries', true],
  ['object.fromentries', 'Object.fromEntries', true],
  ['object.hasown', 'Object.hasOwn || require(\'@nolyfill/shared\').uncurryThis(Object.prototype.hasOwnProperty)', true, { '@nolyfill/shared': 'workspace:*' }],
  ['object.values', 'Object.values', true],
  ['string.prototype.trim', 'String.prototype.trim', false],
  ['string.prototype.trimend', 'String.prototype.trimEnd', false],
  ['string.prototype.trimstart', 'String.prototype.trimStart', false],
  ['string.prototype.trimleft', 'String.prototype.trimLeft', false],
  ['string.prototype.trimright', 'String.prototype.trimRight', false],
  ['string.prototype.matchall', 'String.prototype.matchAll', false],
  ['regexp.prototype.flags', 'RegExp.prototype.flags', false],
  // ['globalthis', 'globalThis', true], // globalthis package's entrypoint is a function, not the implementation
  ['array.prototype.tosorted', `Array.prototype.toSorted || function (compareFn) {
  const o = Object(this);
  const l = Number(o.length);
  const a = new Array(l);
  for (let i = 0; i < l; i++) {
    a[i] = o[i];
  }
  Array.prototype.sort.call(a, compareFn);
  return a;
}`, false],
  ['object.groupby', `Object.groupBy || function (items, callbackfn) {
  const o = Object.create(null);
  let k = 0;
  for (const value of items) {
    const key = callbackfn(value, k++);
    if (key in o) {
      Array.prototype.push.call(o[key], value);
    } else {
      o[key] = [value];
    }
  }
  return o;
}`, true],
  ['array.prototype.find', 'Array.prototype.find', false],
  ['array.from', 'Array.from', true],
  ['string.prototype.padend', 'String.prototype.padEnd', false],
  ['string.prototype.padstart', 'String.prototype.padStart', false],
  ['object.getownpropertydescriptors', 'Object.getOwnPropertyDescriptors', true],
  ['array.prototype.reduce', 'Array.prototype.reduce', false],
  ['object-is', 'Object.is', true],
  ['reflect.ownkeys', 'Reflect.ownKeys', true],
  // ['array.prototype.filter', 'Array.prototype.filter', false],
  ['string.prototype.replaceall', 'String.prototype.replaceAll', false],
  // ['array.prototype.map', 'Array.prototype.map', false],
  ['reflect.getprototypeof', 'Reflect.getPrototypeOf', true],
  // ['object.getprototypeof', 'Object.getPrototypeOf', true]
  ['es-aggregate-error', `typeof AggregateError === 'function'
  ? AggregateError
  : (() => {
    function AggregateError(errors, message) {
      const error = new Error(message);
      Object.setPrototypeOf(error, AggregateError.prototype);
      delete error.constructor;
      Object.defineProperty(error, 'errors', { value: Array.from(errors) });
      return error;
    }
    Object.defineProperty(AggregateError, 'prototype', { writable: false });
    Object.defineProperties(AggregateError.prototype, {
      constructor: {
        enumerable: false,
        configurable: true,
        writable: true,
        value: AggregateError
      },
      message: {
        enumerable: false,
        configurable: true,
        writable: true,
        value: ''
      },
      name: {
        enumerable: false,
        configurable: true,
        writable: true,
        value: 'AggregateError'
      }
    });
    Object.setPrototypeOf(AggregateError.prototype, Error.prototype);
    return AggregateError;
  })()`, true],
  ['promise.any', `Promise.any || function any(iterable) {
  const AggregateError = require('@nolyfill/es-aggregate-error/polyfill')();
  const $reject = Promise.reject.bind(this);
  const $resolve = Promise.resolve.bind(this);
  const $all = Promise.all.bind(this);

  try {
    return $all(
      Array.from(iterable)
        .map((item) => $resolve(item).then(x => $reject(x), x => x))
    ).then(
      (errors) => {
        throw new AggregateError(errors, 'Every promise rejected');
      },
      x => x
    );
  } catch (e) {
    return $reject(e);
  }
}`, true, { '@nolyfill/es-aggregate-error': 'workspace:*' }, '>=12.4.0', 'Promise'],
  ['promise.allsettled', `Promise.allSettled || function allSettled(iterable) {
  const $reject = Promise.reject.bind(this);
  const $resolve = Promise.resolve.bind(this);
  const $all = Promise.all.bind(this);
  return $all(Array.from(iterable).map((item) => {
    const p = $resolve(item);
    try {
      return p.then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason })
      );
    } catch (e) {
      return $reject(e);
    }
  }));
}`, true, {}, '>=12.4.0', 'Promise']
]);

const singleFilePackagesList = /** @type {const} */ ([
  ['has-property-descriptors', `const hasPropertyDescriptors = () => true;
hasPropertyDescriptors.hasArrayLengthDefineBug = () => false;
module.exports = hasPropertyDescriptors;`],
  ['gopd', 'module.exports = Object.getOwnPropertyDescriptor;'],
  ['has-proto', 'module.exports = () => true;'],
  ['get-symbol-description', `const { uncurryThis } = require('@nolyfill/shared');
module.exports = uncurryThis(Object.getOwnPropertyDescriptor(Symbol.prototype, 'description').get);`, { '@nolyfill/shared': 'workspace:*' }],
  ['is-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
const bL = uncurryThis(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
module.exports = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  try {
    bL(obj);
    return true;
  } catch (_) {
    return false;
  }
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['is-shared-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
const bL = uncurryThis(Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'byteLength').get);
module.exports = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  try {
    bL(obj);
    return true;
  } catch (_) {
    return false;
  }
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['typed-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
module.exports = uncurryThis(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Int8Array.prototype), 'buffer').get);`, { '@nolyfill/shared': 'workspace:*' }],
  ['typed-array-byte-length', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayByteLength = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'byteLength').get);
module.exports = (value) => {
  try {
    return typedArrayByteLength(value);
  } catch (e) {
    return false;
  }
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['typed-array-byte-offset', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayByteOffSet = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'byteOffset').get);
module.exports = (value) => {
  try {
    return typedArrayByteOffSet(value);
  } catch (e) {
    return false;
  }
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['typed-array-length', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayLength = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'length').get);
module.exports = (value) => {
  try {
    return typedArrayLength(value);
  } catch (e) {
    return false;
  }
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['harmony-reflect', 'module.exports = Reflect;'],
  ['array-buffer-byte-length', `const { uncurryThis } = require('@nolyfill/shared');
const isArrayBuffer = require('@nolyfill/is-array-buffer');
const bL = uncurryThis(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
module.exports = (ab) => {
  if (!isArrayBuffer(ab)) return NaN;
  return bL(ab);
};`, { '@nolyfill/is-array-buffer': 'workspace:*', '@nolyfill/shared': 'workspace:*' }],
  ['iterator.prototype', 'module.exports = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));'],
  ['available-typed-arrays', `module.exports = [
  'BigInt64Array', 'BigUint64Array',
  'Float32Array', 'Float64Array',
  'Int16Array', 'Int32Array', 'Int8Array',
  'Uint16Array', 'Uint32Array', 'Uint8Array', 'Uint8ClampedArray'
];`],
  ['which-typed-array', `const { uncurryThis } = require('@nolyfill/shared');

const cacheEntries = Object.entries([
  'BigInt64Array', 'BigUint64Array',
  'Float32Array', 'Float64Array',
  'Int16Array', 'Int32Array', 'Int8Array',
  'Uint16Array', 'Uint32Array', 'Uint8Array', 'Uint8ClampedArray'
].reduce((acc, typedArray) => {
  const proto = Object.getPrototypeOf(new globalThis[typedArray]());
  acc[\`$\${typedArray}\`] = uncurryThis((
    Object.getOwnPropertyDescriptor(proto, Symbol.toStringTag)
    || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), Symbol.toStringTag)
  ).get);
  return acc;
}, Object.create(null)));

const tryTypedArrays = (value) => {
  let found = false;
  cacheEntries.forEach(([typedArray, getter]) => {
    if (!found) {
      try {
        if (\`$\${getter(value)}\` === typedArray) {
          found = typedArray.slice(1);
        }
      } catch (e) { /**/ }
    }
  });
  return found;
};

module.exports = (value) => {
  if (!value || typeof value !== 'object') { return false; }
  return tryTypedArrays(value);
};`, { '@nolyfill/shared': 'workspace:*' }],
  ['which-boxed-primitive', `module.exports = (value) => {
  if (value == null || (typeof value !== 'object' && typeof value !== 'function')) return null;
  if (typeof value === 'string') return 'String';
  if (typeof value === 'number') return 'Number';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'symbol') return 'Symbol';
  if (typeof value === 'bigint') return 'BigInt';
  if (typeof value === 'object') {
    if (Object.prototype.toString.call(value) === '[object String]') return 'String';
    if (Object.prototype.toString.call(value) === '[object Number]') return 'Number';
    if (Object.prototype.toString.call(value) === '[object Boolean]') return 'Number';
    if (
      Object.prototype.toString.call(value) === '[object Symbol]'
      && typeof value.valueOf() === 'symbol'
      && Symbol.prototype.toString.call(value).startsWith('Symbol(')
    ) return 'Symbol';
    try {
      BigInt.prototype.valueOf.call(value);
      return 'BigInt';
    } catch (_) {}
  }
};`],
  ['unbox-primitive', `module.exports = function unboxPrimitive(value) {
  if (value == null || (typeof value !== 'object' && typeof value !== 'function')) {
    throw new TypeError(value === null ? 'value is an unboxed primitive' : 'value is a non-boxed-primitive object');
  }
  if (typeof value === 'string' || Object.prototype.toString.call(value) === '[object String]') {
    return String.prototype.toString.call(value);
  }
  if (typeof value === 'number' || Object.prototype.toString.call(value) === '[object Number]') {
    return Number.prototype.valueOf.call(value);
  }
  if (typeof value === 'boolean' || Object.prototype.toString.call(value) === '[object Boolean]') {
    return Boolean.prototype.valueOf.call(value);
  }
  if (typeof value === 'symbol' || (
    Object.prototype.toString.call(value) === '[object Symbol]'
    && typeof value.valueOf() === 'symbol'
    && Symbol.prototype.toString.call(value).startsWith('Symbol(')
  )) {
    return Symbol.prototype.valueOf.call(value);
  }
  try {
    return BigInt.prototype.valueOf.call(value);
  } catch (_) {}
  throw new RangeError('unknown boxed primitive');
};`],
  ['is-regex', `module.exports = (value) => {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false;
  return Object.prototype.toString.call(value) === '[object RegExp]';
};`],
  ['safe-regex-test', `module.exports = (r) => {
  if (
    !r
    || (typeof r !== 'object' && typeof r !== 'function')
    || Object.prototype.toString.call(r) !== '[object RegExp]'
  ) {
    throw new TypeError('\`regex\` must be a RegExp');
  }
  return (s) => RegExp.prototype.exec.call(r, s) !== null;
};`],
  ['safe-array-concat', `const empty = [];
empty[Symbol.isConcatSpreadable] = true;
module.exports = (...args) => {
  for (let i = 0, l = args.length; i < l; i += 1) {
    const arg = args[i];
    if (arg && typeof arg === 'object' && typeof arg[Symbol.isConcatSpreadable] === 'boolean') {
      const arr = Array.isArray(arg) ? Array.prototype.slice.call(arg) : [arg];
      arr[Symbol.isConcatSpreadable] = true;
      args[i] = arr;
    }
  }
  return Array.prototype.concat.apply(empty, args);
};`],
  ['asynciterator.prototype', `/* globals AsyncIterator: false */
var asyncIterProto = typeof AsyncIterator === 'function' ? AsyncIterator.prototype : {};
if (!(Symbol.iterator in asyncIterProto)) {
  asyncIterProto[Symbol.iterator] = function () { return this; };
}
module.exports = asyncIterProto;`],
  ['is-weakref', `/* globals WeakRef: false */
module.exports = (value) => {
  if (typeof WeakRef === 'undefined') return false;
  if (!value || typeof value !== 'object') return false;
  try {
    WeakRef.prototype.deref.call(value);
    return true;
  } catch (e) {
    return false;
  }
};`],
  ['is-symbol', `module.exports = (value) => {
  if (typeof value === 'symbol') return true;
  if (Object.prototype.toString.call(value) !== '[object Symbol]') return false;
  try {
    if (typeof value.valueOf() !== 'symbol') return false;
    return Symbol.prototype.toString.call(value).startsWith('Symbol(');
  } catch (e) {
    return false;
  }
};`],
  ['is-string', `module.exports = (value) => {
  if (typeof value === 'string') return true;
  if (typeof value !== 'object') return false;
  try {
    String.prototype.valueOf.call(value);
    return true;
  } catch (e) { return false; }
};`],
  ['is-date-object', `module.exports = (value) => {
  if (typeof value !== 'object' || value === null) return false;
  try {
    Date.prototype.getDay.call(value);
    return true;
  } catch (e) {
    return false;
  }
};`],
  ['es-set-tostringtag', `module.exports = (object, value, options = {}) => {
  if (options.force || !Object.prototype.hasOwnProperty.call(object, Symbol.toStringTag)) {
    Object.defineProperty(object, Symbol.toStringTag, {
      configurable: true,
      enumerable: false,
      value,
      writable: false
    });
  }
};`],
  ['define-properties', 'module.exports = require(\'@nolyfill/shared\').defineProperties', { '@nolyfill/shared': 'workspace:*' }],
  ['deep-equal', 'module.exports = require(\'dequal\').dequal', { dequal: '2.0.3' }]
]);

const manualPackagesList = /** @type {const} */ ([
  'function-bind', // function-bind's main entry point is not uncurried, and doesn't follow es-shim API
  'has-tostringtag', // two entries (index.js, shams.js)
  'has-symbols', // two entries (index.js, shams.js)
  'es-iterator-helpers', // use rollup prebundle approach
  'globalthis' // globalthis package's entrypoint is a function, not the implementation
]);

const https = require('https');

/**
 * Makes an asynchronous HTTPS request with search params.
 *
 * @param {string} url - The request URL.
 * @param {Object} [params={}] - The search parameters as a JSON object.
 * @returns {Promise<Object>} The response JSON.
 */
async function makeRequest(url, params = {}) {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });

  return new Promise((resolve, reject) => {
    https.get(urlObj.toString(), (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

(async () => {
  await Promise.all([
    ...autoGeneratedPackagesList.map(pkg => createEsShimLikePackage(pkg[0], pkg[1], pkg[2], pkg[3], pkg[4], pkg[5])),
    ...singleFilePackagesList.map(pkg => createSingleFilePackage(pkg[0], pkg[1], pkg[2]))
  ]);

  const allPackages = [
    ...manualPackagesList,
    ...autoGeneratedPackagesList.map(pkg => pkg[0]),
    ...singleFilePackagesList.map(pkg => pkg[0])
  ].sort();

  const newPackageJson = {
    ...currentPackageJson,
    overrides: allPackages
      .reduce((acc, packageName) => {
        acc[/** @type {string} */(packageName)] = `npm:@nolyfill/${packageName}@latest`;
        return acc;
      }, /** @type {Record<string, string>} */({})),
    pnpm: {
      ...currentPackageJson.pnpm,
      overrides: allPackages
        .reduce((acc, packageName) => {
          acc[/** @type {string} */(packageName)] = `workspace:@nolyfill/${packageName}@*`;
          return acc;
        }, /** @type {Record<string, string>} */({}))
    }
  };

  const fetchOriginPackageSize = async (packageName) => {
    const packageJson = await makeRequest('https://packagephobia.com/api.json', {
      p: packageName
    });
    return [packageName, {
      publish: packageJson.publishSize,
      install: packageJson.installSize
    }];
  };

  const packageSize = [];
  const parallel = 8;
  for (let packageIndex = 0; packageIndex < allPackages.length; packageIndex += parallel) {
    const packageNames = Array.from(new Array(parallel))
      .map((_, i) => allPackages[packageIndex + i])
      .filter(Boolean);
    console.log(`Fetching package size (${Math.floor(packageIndex / parallel)}/${allPackages.length / parallel}): ${packageNames.join(', ')}`);
    // eslint-disable-next-line no-await-in-loop -- this is intended to avoid sending too many requests at the same time
    packageSize.push(...await Promise.all(packageNames.map(fetchOriginPackageSize)));
  }
  const cliAllPackagesTs = `/* Generated by create.cjs */
/* eslint-disable */
export const allPackages = ${JSON.stringify(allPackages, null, 2)};\nexport const packageSize: Record<string, { publish: number, install: number }> = ${JSON.stringify(Object.fromEntries(packageSize), null, 2)};`;

  await Promise.all([
    compareAndWriteFile(
      path.join(__dirname, 'package.json'),
      `${JSON.stringify(newPackageJson, null, 2)}\n`
    ),
    compareAndWriteFile(
      path.join(__dirname, 'packages', 'cli', 'src', 'all-packages.ts'),
      cliAllPackagesTs
    )
  ]);

  await ezspawn.async('pnpm', ['i']);
})();

/**
 * @param {string} packageName
 * @param {string} packageImplementation
 * @param {boolean} isStatic
 * @param {Record<string, string>} [extraDependencies]
 * @param {string} [minimumNodeVersion]
 * @param {string | null} [bindTo]
 */
async function createEsShimLikePackage(packageName, packageImplementation, isStatic, extraDependencies = {}, minimumNodeVersion = '>=12.4.0', bindTo = null) {

  const packagePath = path.join(__dirname, 'packages', packageName);

  await fsPromises.mkdir(
    packagePath,
    { recursive: true }
  );

  await Promise.all([
    compareAndWriteFile(
      path.join(packagePath, 'implementation.js'),
      `'use strict';\nmodule.exports = ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'polyfill.js'),
      `'use strict';\nmodule.exports = () => ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'shim.js'),
      `'use strict';\nmodule.exports = () => ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'auto.js'),
      '\'use strict\';\n/* noop */\n'
    ),
    compareAndWriteFile(
      path.join(packagePath, 'index.js'),
      [
        '\'use strict\';',
        isStatic
          ? 'const { makeEsShim } = require(\'@nolyfill/shared\');'
          : 'const { uncurryThis, makeEsShim } = require(\'@nolyfill/shared\');',
        `const impl = ${packageImplementation};`,
        isStatic
          ? `const bound = ${bindTo ? `impl.bind(${bindTo})` : 'impl'};`
          : `const bound = ${bindTo ? `uncurryThis(impl).bind(${bindTo})` : 'uncurryThis(impl)'};`,
        'makeEsShim(bound, impl);',
        'module.exports = bound;',
        ''
      ].join('\n')
    ),
    compareAndWriteFile(
      path.join(packagePath, 'package.json'),
      `${JSON.stringify({
        name: `@nolyfill/${packageName}`,
        version: currentPackageJson.version,
        repository: {
          type: 'git',
          url: 'https://github.com/SukkaW/nolyfill',
          directory: `packages/${packageName}`
        },
        main: './index.js',
        license: 'MIT',
        files: ['*.js'],
        scripts: {},
        dependencies: {
          '@nolyfill/shared': 'workspace:*',
          ...extraDependencies
        },
        engines: {
          node: minimumNodeVersion
        }
      }, null, 2)}\n`
    )
  ]);

  console.log(`[${packageName}] created`);
}

/**
 * @param {string} packageName
 * @param {string} implementation
 * @param {Record<string, string>} [extraDependencies]
 * @param {string} [minimumNodeVersion]
 */
async function createSingleFilePackage(packageName, implementation, extraDependencies = {}, minimumNodeVersion = '>=12.4.0') {
  const packagePath = path.join(__dirname, 'packages', packageName);

  await fsPromises.mkdir(
    packagePath,
    { recursive: true }
  );

  await Promise.all([
    compareAndWriteFile(
      path.join(packagePath, 'index.js'),
      `'use strict';\n${implementation}\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'package.json'),
      `${JSON.stringify({
        name: `@nolyfill/${packageName}`,
        version: currentPackageJson.version,
        repository: {
          type: 'git',
          url: 'https://github.com/SukkaW/nolyfill',
          directory: `packages/${packageName}`
        },
        main: './index.js',
        license: 'MIT',
        files: ['*.js'],
        scripts: {},
        dependencies: extraDependencies,
        engines: {
          node: minimumNodeVersion
        }
      }, null, 2)}\n`
    )
  ]);

  console.log(`[${packageName}] created`);
}
