// Type definitions for apidoc-light 0.50
// Project: https://github.com/apidoc/apidoc
// Definitions by: rigwild <https://github.com/rigwild>
//                 hoonga <https://github.com/hoonga>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export interface ParsedFile {
  filename: string;
  extension: string;
  src: string;
  blocks: Array<{ global: any; local: any; }>;
}

export interface MarkdownOptions {
  config: Record<string, any>;
  rules?: Record<string, MarkdownRuleFunction> | undefined;
  wrapper?: Record<string, MarkdownWrapperFunction> | undefined;
  plugins?: any[] | undefined;
}

export interface MarkdownRuleFunction {
  (tokens: any[], idx: number, options?: any, self?: any): string;
}

export interface MarkdownWrapperFunction {
  (ruleFn: MarkdownRuleFunction, options?: any, self?: any): MarkdownRuleFunction;
}

export interface DocOptions {
  excludeFilters?: string[] | undefined;
  includeFilters?: string[] | undefined;
  src?: string | undefined;
  config?: string | undefined;
  apiprivate?: boolean | undefined;
  verbose?: boolean | undefined;
  single?: boolean | undefined;
  debug?: boolean | undefined;
  parse?: boolean | undefined;
  colorize?: boolean | undefined;
  filters?: Record<string, string> | {
      [keys: string]: {
          postFilter: (parsedFiles: ParsedFile[], parsedFilenames: string[]) => void
      }
  } | undefined;
  languages?: Record<string, string> | {
      [language: string]: {
          docBlocksRegExp: RegExp;
          inlineRegExp: RegExp;
      }
  } | undefined;
  parsers?: Record<string, string> | {
      parse: (content: string, source: string, messages: string) => {
          name: string;
          title: string;
          description: string;
      };
      path: string;
      getGroup?: (() => string) | undefined;
      markdownFields?: string[] | undefined;
      markdownRemovePTags?: string[] | undefined;
  } | undefined;
  workers?: Record<string, string> | {
      [keys: string]: any;
  } | undefined;
  silent?: boolean | undefined;
  dryRun?: boolean | undefined;
  simulate?: boolean | undefined;
  markdown?: boolean | MarkdownOptions | undefined;
  lineEnding?: string | undefined;
  encoding?: string | undefined;
  copyDefinitions?: boolean | undefined;
  filterBy?: string | string[] | undefined;
}

export function createDoc(options: DocOptions): { data: Array<Record<string, any>>; project: Record<string, any> };
