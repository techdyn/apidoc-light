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
let markdownParser;

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
  if (options.markdown === true) {
    markdownParser = new MarkdownIt({
      // Enable breaks for better table cell handling
      breaks: true,
      // Enable HTML to allow <br/> tags
      html: true,
      linkify: false,
      typographer: false,
      // Custom table rendering to handle multi-line content
      highlight: function (str, lang) {
        if (lang) {
          return '<pre><code class="language-' + lang + '">' + str + '</code></pre>';
        }
        return '<pre><code>' + str + '</code></pre>';
      },
    });

    // Add custom rule to handle multi-line content in table cells
    markdownParser.renderer.rules.table_cell_content = function(tokens, idx) {
      const content = tokens[idx].content;
      // Replace newlines with <br/> tags in table cells
      return content.replace(/\n/g, '<br/>');
    };

    // Add custom rule to handle lists in table cells
    markdownParser.renderer.rules.list_item = function(tokens, idx) {
      const content = tokens[idx].content;
      // Format list items with proper spacing and line breaks
      return '<br/>- ' + content.trim();
    };
  } else if (options.markdown !== false) {
    // Include custom Parser @see https://github.com/apidoc/apidoc/wiki/Custom-markdown-parser and test/markdown/custom_markdown_parser.js
    if (options.markdown.substr(0, 2) !== '..' && ((options.markdown.substr(0, 1) !== '/' && options.markdown.substr(1, 2) !== ':/' && options.markdown.substr(1, 2) !== ':\\' && options.markdown.substr(0, 1) !== '~') || options.markdown.substr(0, 1) === '.')) { // eslint-disable-line no-extra-parens
      options.markdown = path.join(process.cwd(), options.markdown);
    }
    const CustomMarkdown = require(options.markdown); // Load custom markdown parser
    markdownParser = new CustomMarkdown();
  }
  return markdownParser;
}

module.exports = {
  getLogger: getLogger,
  getMarkdownParser: getMarkdownParser,
};
