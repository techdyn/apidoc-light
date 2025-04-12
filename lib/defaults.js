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

// Get the default logger
function getLogger (options) {
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

function getMarkdownParser (options) {
  // Markdown Parser: enable / disable / use a custom parser.
  let markdownParser;

  // Default markdown configuration
  const defaultConfig = {
    breaks: true,          // Enable breaks for better table cell handling
    html: true,            // Enable HTML to allow <br/> tags
    linkify: false,
    typographer: false,
    highlight: function (str, lang) {
      if (lang) {
        return '<pre><code class="language-' + lang + '">' + str + '</code></pre>';
      }
      return '<pre><code>' + str + '</code></pre>';
    },
  };

  // Default custom rules
  const defaultRules = {
    table_cell_content: function(tokens, idx) {
      const content = tokens[idx].content;
      // Replace newlines with <br/> tags in table cells
      return content.replace(/\n/g, '<br/>');
    },
    list_item: function(tokens, idx) {
      const content = tokens[idx].content;
      // Format list items with proper spacing and line breaks
      return '<br/>- ' + content.trim();
    }
  };

  if (options.markdown === true) {
    // Use default configuration
    markdownParser = new MarkdownIt(defaultConfig);
    
    // Apply default rules
    Object.entries(defaultRules).forEach(([ruleName, ruleFunction]) => {
      markdownParser.renderer.rules[ruleName] = ruleFunction;
    });
  } else if (typeof options.markdown === 'object' && !options.markdown.substr) {
    // Check if it's a MarkdownOptions object (not a string path)
    /** @type {import('../index').MarkdownOptions} */
    const markdownOptions = options.markdown;
    
    // Merge user config with defaults, ensuring type safety
    const userConfig = { 
      ...defaultConfig,
      ...(markdownOptions.config || {})
    };
    markdownParser = new MarkdownIt(userConfig);
    
    // Merge user rules with defaults, ensuring proper typing
    if (markdownOptions.rules) {
      Object.entries(markdownOptions.rules).forEach(([ruleName, ruleFunction]) => {
        if (typeof ruleFunction === 'function') {
          markdownParser.renderer.rules[ruleName] = ruleFunction;
        }
      });
    }

    // Apply default rules if not overridden
    Object.entries(defaultRules).forEach(([ruleName, ruleFunction]) => {
      if (!markdownParser.renderer.rules[ruleName]) {
        markdownParser.renderer.rules[ruleName] = ruleFunction;
      }
    });

    // Apply plugins with type checking
    if (Array.isArray(markdownOptions.plugins)) {
      markdownOptions.plugins.forEach(plugin => {
        if (Array.isArray(plugin)) {
          const [pluginFn, ...args] = plugin;
          if (typeof pluginFn === 'function') {
            markdownParser.use(pluginFn, ...args);
          }
        } else if (typeof plugin === 'function') {
          markdownParser.use(plugin);
        }
      });
    }
  } else if (options.markdown !== false) {
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
    markdownParser = new CustomMarkdown();
  }
  return markdownParser;
}

module.exports = {
  getLogger: getLogger,
  getMarkdownParser: getMarkdownParser,
};
