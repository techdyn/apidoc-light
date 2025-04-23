/*
 * apidoc
 * https://apidocjs.com
 *
 * Authors:
 * Peter Rottmann <rottmann@inveris.de>
 * Nicolas CARPi @ Deltablot
 * Copyright (c) 2013 inveris OHG
 * Licensed under the MIT license.
 */

/**
 * All about options
 */
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const { getPath, setPath } = require('./core/utils/property_path');

const DEFAULT_DEST = 'doc';
const DEFAULT_SRC = ['./src'];
const DEFAULT_TEMPLATE = 'template';

const defaultOptions = {
  src: DEFAULT_SRC,
  dest: path.resolve(path.join(__dirname, '..', DEFAULT_DEST)) + path.sep,
  template: path.resolve(path.join(__dirname, '..', DEFAULT_TEMPLATE)) + path.sep,
  templateSingleFile: path.resolve(__dirname, '../template-single/index.html'),

  debug: false,
  single: false, // build to single file
  silent: false,
  verbose: false,
  dryRun: true,
  colorize: true,
  markdown: true,
  config: '',
  apiprivate: false,
  encoding: 'utf8',
};

/**
* Default config handlers
*/
const defaultConfigHandlers = {
  fnAssign: ({ key, self, path, map, property }, [name, fn]) => {
    if (typeof fn === 'function') {
      const { resolvers, wrappers } = property;
      const finalFn = resolvers?.wrappers?.bind(null, wrappers, property, fn, self)();
      setPath(self, [path, name], finalFn || fn);
    }
  },
  markdownPlugin: ({ self }, [index, plugin]) => {
    if (Array.isArray(plugin)) {
      const [pluginFn, ...args] = plugin;
      if (typeof pluginFn === 'function') {
        self.use(pluginFn, ...args);
      }
    } else if (typeof plugin === 'function') {
      self.use(plugin);
    }
  }
};

/**
 * Get a value of a specific type
 * 
 * @param {string} type 
 * @param {Object} property 
 * @returns 
 */
let getAsType = (type, property) => {
  switch (type || property?.type || "object") {
    case "object":
      return property ? {
        ...(property.defaults || {}),
        ...(property.values || {})
      } : {};
    case "array":
      return property ? [
        ...(property.defaults || []),
        ...(property.values || [])
      ] : [];
    default:
      console.error("processConfigMap: Invalid type", { type });
      return null;
  }
};

/**
 * Process a config map
 * 
 * @param {Object} map 
 * @param {Object} ctx 
 * @param {Object} input 
 */
let processConfigMap = (map, ctx, input) => {
  /* Iterate our config map -- process each target */
  Object.entries(map).forEach(([objKey, objMappings]) => {
    Object.entries(objMappings).forEach(([leftPath, leftCfg]) => {
      const { handler, path, propName, targetType = "object", finalFn = null } = leftCfg?.source || {};

      if (!propName) {
        console.error("processConfigMap: Invalid propName", { leftCfg });
        return;
      }

      const inValue = getPath(input, path);
      const property = (() => {
        const p = {
          name: propName,
          defaults: inValue?.defaults[propName] || getAsType(targetType),
          values: inValue?.values[propName] || getAsType(targetType)
        };
        p.final =
          typeof finalFn === "function" ?
            finalFn(targetType, p) :
            getAsType(targetType, p);
        return p;
      })();

      const leftHandler = (
        (typeof handler === "function" && handler) ||
        (typeof handler === "string" && defaultConfigHandlers[handler]) ||
        (() => { console.error("processConfigMap: Invalid handler", handler); })
      ).bind(null, {
        self: ctx?.[objKey],
        key: objKey,
        path: leftPath,
        map: leftCfg,
        ctx,
        property
      });

      const n = property?.final;
      const f = (typeof n === "object" && Object.entries(n)) || (Array.isArray(n) && n);
      if (!f) {
        throw new Error("processConfigMap: Invalid final object type");
      }

      f.forEach(leftHandler);
    });
  });

  return ctx;
};

function process(options) {
  // merge given options with defaults
  options = _.defaults({}, options, defaultOptions);

  // if a config file is given, read it to figure out input and output
  if (options.config) {
    // make sure that we are provided a config file, not a directory
    if (fs.statSync(options.config).isDirectory()) {
      throw new Error('[error] Invalid option: --config/-c must be a path to a file. Directory provided.');
    }

    const configPath = path.resolve(options.config);
    const apidocConfig = require(configPath);
    // if dest is present in config file, set it in options, but only if it's the default value, as cli options should override config file options
    if (apidocConfig.output && options.dest === defaultOptions.dest) {
      // keep a trailing slash
      options.dest = path.resolve(path.join(apidocConfig.output, path.sep));
    }

    // do the same for input
    if (apidocConfig.input instanceof Array && options.src[0] === DEFAULT_SRC[0]) {
      // keep a trailing slash
      const input = apidocConfig.input.map(p => path.resolve(p) + path.sep);
      options.src = input;
    }
  }

  // add a trailing slash to output destination because it's always a folder
  options.dest = path.join(options.dest, path.sep);
  options.template = path.join(options.template, path.sep);

  // Line-Ending option
  if (options.lineEnding) {
    if (options.lineEnding === 'CRLF') { // win32
      options.lineEnding = '\r\n';
    } else if (options.lineEnding === 'CR') { // darwin
      options.lineEnding = '\r';
    } else { // linux
      options.lineEnding = '\n';
    }
  }

  return options;
}

module.exports = {
  process,
  defaultOptions,
  processConfigMap,
  defaultConfigHandlers
};
