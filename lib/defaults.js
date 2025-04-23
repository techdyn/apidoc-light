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
 * Provide default values for the app
 */
const path = require('path');
const winston = require('winston');
const MarkdownIt = require('markdown-it');
const { process, processConfigMap, defaultConfigHandlers } = require('./options');

// Get the default logger
const getLogger = (options) => {
  // default format
  let format = winston.format.simple();
  if (options.logFormat === 'json') {
    // remove colors for json output
    options.colorize = false;
    format = winston.format.json();
  }
  // add colors (default is true)
  if (options.colorize) {
    format = winston.format.combine(
      winston.format.colorize(),
      format,
    );
  }

  // console logger
  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: options.debug ? 'debug' : options.verbose ? 'verbose' : 'info',
        silent: options.silent,
      }),
    ],
    format: format,
  });
}

const getMarkdownParser = (options) => {

  if (!options.markdown) {
    console.warn("No markdown parser is disabled via options");
    return null;
  }

  if (typeof options.markdown === "string") {
    // Handle custom parser path
    let customParserPath = options.markdown;
    if (customParserPath.substr(0, 2) !== '..' &&
      ((customParserPath.substr(0, 1) !== '/' &&
        customParserPath.substr(1, 2) !== ':/' &&
        customParserPath.substr(1, 2) !== ':\\' &&
        customParserPath.substr(0, 1) !== '~') ||
        customParserPath.substr(0, 1) === '.')) {
      customParserPath = path.join(process.cwd(), customParserPath);
    }
    const CustomMarkdown = require(customParserPath);
    return new CustomMarkdown();
  }

  // Default markdown configuration
  const defaultMarkdownOptions = {
    config: {
      breaks: true,          // Enable breaks for better table cell handling
      html: true,            // Enable HTML to allow <br/> tags
      linkify: false,
      typographer: false,
      highlight: function (str, lang) {
        if (lang) {
          return '<pre><code class="language-' + lang + '">' + str + '</code></pre>';
        }
        return '<pre><code>' + str + '</code></pre>';
      }
    },
    resolvers: {
      wrappers: (wrappers, property, self, fn, ...params) => {
        if (wrappers[property.name]) {
          if (typeof wrappers[property.name] === 'function') {
            console.info('Resolver: Wrapper "' + property.name + '" found');
            return wrappers[property.name](self, fn, ...params);
          }
          console.warn('Resolver: Wrapper "' + property.name + '" is not a function');
        } else {
          console.warn('Resolver: No wrapper found for "' + property.name + '"');
        }
        return fn;
      }
    },
    wrappers: {
      rules: (self, ruleFn, options) => (tokens, idx) => ruleFn(tokens, idx, options, self)
    },
    rules: {
      table_cell_content: function (tokens, idx) {
        const content = tokens[idx].content;
        // Replace newlines with <br/> tags in table cells
        return content.replace(/\n/g, '<br/>');
      },
      list_item: function (tokens, idx) {
        const content = tokens[idx].content;
        // Format list items with proper spacing and line breaks
        return '<br/>- ' + content.trim();
      }
    }
  };

  /**
  * Default init map
  */
  const configMap = {
    parser: {
      "renderer.rules": {
        source: {
          path: "markdown",
          propName: "rules",
          handler: "fnAssign"
        }
      },
      "__plugins": {
        source: {
          path: "markdown",
          propName: "plugins",
          handler: "markdownPlugin",
          final: "array"
        }
      }
    }
  };

  if (options.markdown) {
    const props = {
      values: (Object.is(options.markdown) && options?.markdown) || {},
      defaults: defaultMarkdownOptions
    };

    const { parser: markdownParser } = processConfigMap(
      configMap,
      {
        parser: new MarkdownIt({
          ...(props.defaults?.["config"] || {}),
          ...(props.values?.["config"] || {})
        })
      },
      {
        markdown: props
      }
    );
    return markdownParser;
  }

  return null;
}

module.exports = {
  getLogger: getLogger,
  getMarkdownParser: getMarkdownParser,
};
