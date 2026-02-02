#!/usr/bin/env node
/**
 * React Development Plugin - Quality Check Hook
 * Unified quality checker for React/TypeScript projects
 * Based on: https://github.com/bartolli/claude-code-typescript-hooks
 *
 * EXIT CODES:
 * 0 - Success (all checks passed)
 * 1 - General error (missing dependencies, etc.)
 * 2 - Quality issues found - ALL must be fixed (blocking)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Get project root using CLAUDE_PROJECT_DIR environment variable
 * @returns {string} Project root directory
 */
function getProjectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

const projectRoot = getProjectRoot();
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

/**
 * Intelligent TypeScript Config Cache with checksum validation
 * Handles multiple tsconfig files and maps files to appropriate configs
 */
class TypeScriptConfigCache {
  constructor() {
    this.cacheFile = path.join(projectRoot, '.tsconfig-cache.json');
    this.cache = { hashes: {}, mappings: {} };
    this.loadCache();
  }

  getConfigHash(configPath) {
    try {
      const content = require('fs').readFileSync(configPath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (e) {
      return null;
    }
  }

  findTsConfigFiles() {
    const configs = [];
    const commonConfigs = [
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'tsconfig.test.json',
    ];

    for (const config of commonConfigs) {
      const configPath = path.join(projectRoot, config);
      if (require('fs').existsSync(configPath)) {
        configs.push(configPath);
      }
    }
    return configs;
  }

  isValid() {
    const configFiles = this.findTsConfigFiles();
    if (Object.keys(this.cache.hashes).length !== configFiles.length) {
      return false;
    }
    for (const configPath of configFiles) {
      const currentHash = this.getConfigHash(configPath);
      if (currentHash !== this.cache.hashes[configPath]) {
        return false;
      }
    }
    return true;
  }

  rebuild() {
    this.cache = { hashes: {}, mappings: {} };

    // Process from general to specific (base config first)
    const configPriority = [
      'tsconfig.json',        // Base config first
      'tsconfig.test.json',
      'tsconfig.node.json',
      'tsconfig.app.json',    // Most specific last
    ];

    configPriority.forEach((configName) => {
      const configPath = path.join(projectRoot, configName);
      if (!require('fs').existsSync(configPath)) {
        return;
      }

      this.cache.hashes[configPath] = this.getConfigHash(configPath);

      try {
        const configContent = require('fs').readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        if (config.include) {
          config.include.forEach((pattern) => {
            if (!this.cache.mappings[pattern]) {
              this.cache.mappings[pattern] = {
                configPath,
                excludes: config.exclude || [],
              };
            }
          });
        }
      } catch (e) {
        // Skip invalid configs
      }
    });

    this.saveCache();
  }

  loadCache() {
    try {
      const cacheContent = require('fs').readFileSync(this.cacheFile, 'utf8');
      this.cache = JSON.parse(cacheContent);
    } catch (e) {
      this.cache = { hashes: {}, mappings: {} };
    }
  }

  saveCache() {
    try {
      require('fs').writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (e) {
      // Ignore cache save errors
    }
  }

  getTsConfigForFile(filePath) {
    if (!this.isValid()) {
      this.rebuild();
    }

    const relativePath = path.relative(projectRoot, filePath);

    const sortedMappings = Object.entries(this.cache.mappings).sort(([a], [b]) => {
      const aSpecificity = a.split('/').length + (a.includes('**') ? 0 : 10);
      const bSpecificity = b.split('/').length + (b.includes('**') ? 0 : 10);
      return bSpecificity - aSpecificity; // More specific (higher score) checked first
    });

    for (const [pattern, mapping] of sortedMappings) {
      const configPath = typeof mapping === 'string' ? mapping : mapping.configPath;
      const excludes = typeof mapping === 'string' ? [] : mapping.excludes;

      if (this.matchesPattern(relativePath, pattern)) {
        let isExcluded = false;
        for (const exclude of excludes) {
          if (this.matchesPattern(relativePath, exclude)) {
            isExcluded = true;
            break;
          }
        }
        if (!isExcluded) {
          return configPath;
        }
      }
    }

    // Test files
    if (
      relativePath.includes('/test/') ||
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.')
    ) {
      const testConfig = path.join(projectRoot, 'tsconfig.test.json');
      if (require('fs').existsSync(testConfig)) {
        return testConfig;
      }
    }

    return path.join(projectRoot, 'tsconfig.json');
  }

  matchesPattern(filePath, pattern) {
    if (pattern.endsWith('/**/*')) {
      const baseDir = pattern.slice(0, -5);
      return filePath.startsWith(baseDir);
    }

    let regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '🌟')
      .replace(/\*/g, '[^/]*')
      .replace(/🌟/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}

const tsConfigCache = new TypeScriptConfigCache();

/**
 * File locking mechanism to prevent race conditions
 * when multiple hooks run in parallel on the same file
 */
class FileLock {
  constructor(filePath) {
    this.lockPath = `${filePath}.quality-check.lock`;
    this.maxAge = 30000; // 30 seconds
  }

  async acquire() {
    try {
      const lockInfo = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
      await fs.writeFile(this.lockPath, lockInfo, { flag: 'wx' });
      return true;
    } catch (e) {
      if (e.code === 'EEXIST') {
        // Check if lock is stale
        try {
          const lockData = await fs.readFile(this.lockPath, 'utf8');
          const lock = JSON.parse(lockData);
          if (Date.now() - lock.timestamp > this.maxAge) {
            await fs.unlink(this.lockPath);
            return this.acquire();
          }
          return false; // Active lock
        } catch {
          // Lock file corrupted, remove and retry
          try {
            await fs.unlink(this.lockPath);
            return this.acquire();
          } catch {
            return false;
          }
        }
      }
      throw e;
    }
  }

  async release() {
    try {
      await fs.unlink(this.lockPath);
    } catch (e) {
      // Lock already gone
    }
  }
}

// ANSI color codes
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[0;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
};

/**
 * Load configuration from hook-config.json with environment variable overrides
 */
function loadConfig() {
  let fileConfig = {};

  try {
    const configPath = path.join(pluginRoot, 'config', 'hook-config.json');
    if (require('fs').existsSync(configPath)) {
      fileConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    // Config file not found or invalid, use defaults
  }

  return {
    typescriptEnabled:
      process.env.CLAUDE_HOOKS_TYPESCRIPT_ENABLED !== undefined
        ? process.env.CLAUDE_HOOKS_TYPESCRIPT_ENABLED !== 'false'
        : (fileConfig.typescript?.enabled ?? true),

    showDependencyErrors:
      process.env.CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS !== undefined
        ? process.env.CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS === 'true'
        : (fileConfig.typescript?.showDependencyErrors ?? false),

    eslintEnabled:
      process.env.CLAUDE_HOOKS_ESLINT_ENABLED !== undefined
        ? process.env.CLAUDE_HOOKS_ESLINT_ENABLED !== 'false'
        : (fileConfig.eslint?.enabled ?? true),

    eslintAutofix:
      process.env.CLAUDE_HOOKS_ESLINT_AUTOFIX !== undefined
        ? process.env.CLAUDE_HOOKS_ESLINT_AUTOFIX === 'true'
        : (fileConfig.eslint?.autofix ?? true),

    prettierEnabled:
      process.env.CLAUDE_HOOKS_PRETTIER_ENABLED !== undefined
        ? process.env.CLAUDE_HOOKS_PRETTIER_ENABLED !== 'false'
        : (fileConfig.prettier?.enabled ?? true),

    prettierAutofix:
      process.env.CLAUDE_HOOKS_PRETTIER_AUTOFIX !== undefined
        ? process.env.CLAUDE_HOOKS_PRETTIER_AUTOFIX === 'true'
        : (fileConfig.prettier?.autofix ?? true),

    autofixSilent:
      process.env.CLAUDE_HOOKS_AUTOFIX_SILENT !== undefined
        ? process.env.CLAUDE_HOOKS_AUTOFIX_SILENT === 'true'
        : (fileConfig.general?.autofixSilent ?? true),

    debug:
      process.env.CLAUDE_HOOKS_DEBUG !== undefined
        ? process.env.CLAUDE_HOOKS_DEBUG === 'true'
        : (fileConfig.general?.debug ?? false),

    ignorePatterns: fileConfig.ignore?.patterns || [],
    _fileConfig: fileConfig,
  };
}

const config = loadConfig();

// Logging: All logs go to stderr for Claude Code hooks compliance
// Claude reads stdout for structured data, stderr for human-readable diagnostics
const log = {
  info: (msg) => console.error(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  success: (msg) => console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
  warning: (msg) => console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  debug: (msg) => {
    if (config.debug) {
      console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`);
    }
  },
};

// Try to load modules from project's node_modules
let ESLint, prettier, ts;

try {
  ({ ESLint } = require(path.join(projectRoot, 'node_modules', 'eslint')));
} catch (e) {
  try {
    ({ ESLint } = require('eslint'));
  } catch (e2) {
    log.debug('ESLint not found - will skip ESLint checks');
  }
}

try {
  prettier = require(path.join(projectRoot, 'node_modules', 'prettier'));
} catch (e) {
  try {
    prettier = require('prettier');
  } catch (e2) {
    log.debug('Prettier not found - will skip Prettier checks');
  }
}

try {
  ts = require(path.join(projectRoot, 'node_modules', 'typescript'));
} catch (e) {
  try {
    ts = require('typescript');
  } catch (e2) {
    log.debug('TypeScript not found - will skip TypeScript checks');
  }
}

/**
 * Quality checker for a single file
 */
class QualityChecker {
  constructor(filePath) {
    this.filePath = filePath;
    this.fileType = this.detectFileType(filePath);
    this.errors = [];
    this.autofixes = [];
  }

  detectFileType(filePath) {
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) {
      return 'test';
    }
    if (/\/store\/|\/slices\/|\/reducers\//.test(filePath)) {
      return 'redux';
    }
    if (/\/components\/.*\.(tsx|jsx)$/.test(filePath)) {
      return 'component';
    }
    if (/\/hooks\/.*\.(ts|tsx)$/.test(filePath)) {
      return 'hook';
    }
    if (/\.(ts|tsx)$/.test(filePath)) {
      return 'typescript';
    }
    if (/\.(js|jsx)$/.test(filePath)) {
      return 'javascript';
    }
    return 'unknown';
  }

  async checkAll() {
    if (this.fileType === 'unknown') {
      log.info('Unknown file type, skipping detailed checks');
      return { errors: [], autofixes: [] };
    }

    const checkPromises = [];

    if (config.typescriptEnabled && ts) {
      checkPromises.push(this.checkTypeScript());
    }

    if (config.eslintEnabled && ESLint) {
      checkPromises.push(this.checkESLint());
    }

    if (config.prettierEnabled && prettier) {
      checkPromises.push(this.checkPrettier());
    }

    checkPromises.push(this.checkCommonIssues());

    await Promise.all(checkPromises);
    await this.suggestRelatedTests();

    return {
      errors: this.errors,
      autofixes: this.autofixes,
    };
  }

  async checkTypeScript() {
    if (!ts) return;

    log.info('Running TypeScript compilation check...');

    try {
      const configPath = tsConfigCache.getTsConfigForFile(this.filePath);

      if (!require('fs').existsSync(configPath)) {
        log.debug(`No TypeScript config found: ${configPath}`);
        return;
      }

      log.debug(
        `Using TypeScript config: ${path.basename(configPath)} for ${path.relative(projectRoot, this.filePath)}`
      );

      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );

      const program = ts.createProgram([this.filePath], parsedConfig.options);
      const diagnostics = ts.getPreEmitDiagnostics(program);

      const diagnosticsByFile = new Map();
      diagnostics.forEach((d) => {
        if (d.file) {
          const fileName = d.file.fileName;
          if (!diagnosticsByFile.has(fileName)) {
            diagnosticsByFile.set(fileName, []);
          }
          diagnosticsByFile.get(fileName).push(d);
        }
      });

      const editedFileDiagnostics = diagnosticsByFile.get(this.filePath) || [];
      if (editedFileDiagnostics.length > 0) {
        this.errors.push({
          message: `TypeScript errors in edited file (using ${path.basename(configPath)})`,
          isBlocking: true,
          source: 'typescript',
          filePath: this.filePath
        });
        editedFileDiagnostics.forEach((diagnostic) => {
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start
          );
          console.error(
            `  ❌ ${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`
          );
        });
      }

      if (config.showDependencyErrors) {
        let hasDepErrors = false;
        diagnosticsByFile.forEach((diags, fileName) => {
          if (fileName !== this.filePath) {
            if (!hasDepErrors) {
              console.error('\n[DEPENDENCY ERRORS] Files imported by your edited file:');
              hasDepErrors = true;
            }
            console.error(`  ⚠️ ${fileName}:`);
            diags.forEach((diagnostic) => {
              const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
              const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start
              );
              console.error(`    Line ${line + 1}:${character + 1} - ${message}`);
            });
          }
        });
      }

      if (diagnostics.length === 0) {
        log.success('TypeScript compilation passed');
      }
    } catch (error) {
      log.debug(`TypeScript check error: ${error.message}`);
    }
  }

  async checkESLint() {
    if (!ESLint) return;

    log.info('Running ESLint...');

    try {
      const eslint = new ESLint({
        fix: config.eslintAutofix,
        cwd: projectRoot,
      });

      const results = await eslint.lintFiles([this.filePath]);
      const result = results[0];

      if (result.errorCount > 0 || result.warningCount > 0) {
        if (config.eslintAutofix && result.output) {
          log.warning('ESLint issues found, attempting auto-fix...');
          await fs.writeFile(this.filePath, result.output);

          const resultsAfterFix = await eslint.lintFiles([this.filePath]);
          const resultAfterFix = resultsAfterFix[0];

          if (resultAfterFix.errorCount === 0 && resultAfterFix.warningCount === 0) {
            log.success('ESLint auto-fixed all issues!');
            if (config.autofixSilent) {
              this.autofixes.push('ESLint auto-fixed formatting/style issues');
            } else {
              this.errors.push({
                message: 'ESLint issues were auto-fixed - verify the changes',
                isBlocking: false,
                source: 'eslint',
                filePath: this.filePath
              });
            }
          } else {
            this.errors.push({
              message: `ESLint found issues that couldn't be auto-fixed in ${this.filePath}`,
              isBlocking: true,
              source: 'eslint',
              filePath: this.filePath
            });
            const formatter = await eslint.loadFormatter('stylish');
            const output = await formatter.format(resultsAfterFix);
            console.error(output);
          }
        } else {
          this.errors.push({
            message: `ESLint found issues in ${this.filePath}`,
            isBlocking: true,
            source: 'eslint',
            filePath: this.filePath
          });
          const formatter = await eslint.loadFormatter('stylish');
          const output = await formatter.format(results);
          console.error(output);
        }
      } else {
        log.success('ESLint passed');
      }
    } catch (error) {
      log.debug(`ESLint check error: ${error.message}`);
    }
  }

  async checkPrettier() {
    if (!prettier) return;

    log.info('Running Prettier check...');

    try {
      const fileContent = await fs.readFile(this.filePath, 'utf8');
      const prettierConfig = await prettier.resolveConfig(this.filePath);

      const isFormatted = await prettier.check(fileContent, {
        ...prettierConfig,
        filepath: this.filePath,
      });

      if (!isFormatted) {
        if (config.prettierAutofix) {
          log.warning('Prettier formatting issues found, auto-fixing...');

          const formatted = await prettier.format(fileContent, {
            ...prettierConfig,
            filepath: this.filePath,
          });

          await fs.writeFile(this.filePath, formatted);
          log.success('Prettier auto-formatted the file!');

          if (config.autofixSilent) {
            this.autofixes.push('Prettier auto-formatted the file');
          } else {
            this.errors.push({
              message: 'Prettier formatting was auto-fixed - verify the changes',
              isBlocking: false,
              source: 'prettier',
              filePath: this.filePath
            });
          }
        } else {
          this.errors.push({
            message: `Prettier formatting issues in ${this.filePath}`,
            isBlocking: true,
            source: 'prettier',
            filePath: this.filePath
          });
          console.error('Run prettier --write to fix');
        }
      } else {
        log.success('Prettier formatting correct');
      }
    } catch (error) {
      log.debug(`Prettier check error: ${error.message}`);
    }
  }

  async checkCommonIssues() {
    log.info('Checking for common issues...');

    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      const lines = content.split('\n');
      let foundIssues = false;

      // Check for 'as any' in TypeScript files
      const asAnyRule = config._fileConfig.rules?.asAny || {};
      if (
        (this.fileType === 'typescript' || this.fileType === 'component' || this.fileType === 'hook') &&
        asAnyRule.enabled !== false
      ) {
        lines.forEach((line, index) => {
          if (line.includes('as any') && !line.trim().startsWith('//')) {
            const severity = asAnyRule.severity || 'warning';
            const message =
              asAnyRule.message || 'Prefer proper types or "as unknown" for type assertions';

            if (severity === 'error') {
              this.errors.push({
                message: `Found 'as any' usage in ${this.filePath} - ${message}`,
                isBlocking: true,
                source: 'custom',
                filePath: this.filePath
              });
              console.error(`  Line ${index + 1}: ${line.trim()}`);
              foundIssues = true;
            } else {
              log.warning(`'as any' usage at line ${index + 1}: ${message}`);
            }
          }
        });
      }

      // Check for console statements
      const consoleRule = config._fileConfig.rules?.console || {};
      let allowConsole = consoleRule.enabled === false;

      if (!allowConsole) {
        const allowedPaths = consoleRule.allowIn?.paths || [];
        const allowedFileTypes = consoleRule.allowIn?.fileTypes || ['test'];
        const allowedPatterns = consoleRule.allowIn?.patterns || [];

        if (allowedPaths.some((p) => this.filePath.includes(p))) {
          allowConsole = true;
        }
        if (allowedFileTypes.includes(this.fileType)) {
          allowConsole = true;
        }
        const fileName = path.basename(this.filePath);
        if (allowedPatterns.some((pattern) => new RegExp(pattern.replace(/\*/g, '.*')).test(fileName))) {
          allowConsole = true;
        }
      }

      if (!allowConsole) {
        lines.forEach((line, index) => {
          if (/console\./.test(line) && !line.trim().startsWith('//')) {
            const severity = consoleRule.severity || 'info';
            const message = consoleRule.message || 'Consider removing console statements';

            if (severity === 'error') {
              this.errors.push({
                message: `Found console statements in ${this.filePath} - ${message}`,
                isBlocking: true,
                source: 'custom',
                filePath: this.filePath
              });
              console.error(`  Line ${index + 1}: ${line.trim()}`);
              foundIssues = true;
            } else {
              log.warning(`Console usage at line ${index + 1}: ${message}`);
            }
          }
        });
      }

      // Check for debugger statements
      lines.forEach((line, index) => {
        if (/\bdebugger\b/.test(line) && !line.trim().startsWith('//')) {
          this.errors.push({
            message: `Found debugger statement in ${this.filePath} - Remove before committing`,
            isBlocking: true,
            source: 'custom',
            filePath: this.filePath
          });
          console.error(`  Line ${index + 1}: ${line.trim()}`);
          foundIssues = true;
        }
      });

      // Check for TODO/FIXME comments (info only)
      lines.forEach((line, index) => {
        if (/TODO|FIXME/.test(line)) {
          log.warning(`Found TODO/FIXME comment at line ${index + 1}`);
        }
      });

      // React-specific checks removed
      // NOTE: Proper React hook validation (useEffect dependency arrays, etc.)
      // requires AST parsing. Regex-based detection is too unreliable and produces
      // false positives/negatives. Use ESLint with react-hooks plugin instead.

      if (!foundIssues) {
        log.success('No common issues found');
      }
    } catch (error) {
      log.debug(`Common issues check error: ${error.message}`);
    }
  }

  async suggestRelatedTests() {
    if (this.fileType === 'test') return;

    const baseName = this.filePath.replace(/\.[^.]+$/, '');
    const testExtensions = ['test.ts', 'test.tsx', 'spec.ts', 'spec.tsx'];
    let hasTests = false;

    for (const ext of testExtensions) {
      try {
        await fs.access(`${baseName}.${ext}`);
        hasTests = true;
        log.warning(`💡 Related test found: ${path.basename(baseName)}.${ext}`);
        log.warning('   Consider running the tests to ensure nothing broke');
        break;
      } catch {
        // File doesn't exist
      }
    }

    if (!hasTests) {
      const dir = path.dirname(this.filePath);
      const baseFileName = path.basename(this.filePath).replace(/\.[^.]+$/, '');

      for (const ext of testExtensions) {
        try {
          await fs.access(path.join(dir, '__tests__', `${baseFileName}.${ext}`));
          hasTests = true;
          log.warning(`💡 Related test found: __tests__/${baseFileName}.${ext}`);
          break;
        } catch {
          // File doesn't exist
        }
      }
    }

    if (!hasTests && this.fileType !== 'test') {
      log.warning(`💡 No test file found for ${path.basename(this.filePath)}`);
    }

    // React-specific reminders
    if (this.fileType === 'redux') {
      log.warning('💡 Redux state file! Consider testing state updates');
    } else if (this.fileType === 'component') {
      log.warning('💡 Component file! Consider testing UI behavior');
    } else if (this.fileType === 'hook') {
      log.warning('💡 Hook file! Consider testing hook behavior with @testing-library/react-hooks');
    }
  }
}

/**
 * Parse JSON input from stdin or command line argument
 */
async function parseInput() {
  // Check for command line argument (file path directly)
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] && !args[0].startsWith('{')) {
    return { tool_input: { file_path: args[0] } };
  }

  // Read from stdin
  let inputData = '';
  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  if (!inputData.trim()) {
    log.warning('No input provided.');
    process.exit(0);
  }

  try {
    return JSON.parse(inputData);
  } catch (error) {
    // Maybe it's just a file path
    if (inputData.trim() && !inputData.includes('{')) {
      return { tool_input: { file_path: inputData.trim() } };
    }
    log.error(`Failed to parse JSON input: ${error.message}`);
    process.exit(1);
  }
}

function extractFilePath(input) {
  const { tool_input } = input;
  if (!tool_input) return null;
  return tool_input.file_path || tool_input.path || tool_input.notebook_path || null;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isSourceFile(filePath) {
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

function printSummary(errors, autofixes) {
  if (autofixes.length > 0) {
    console.error(`\n${colors.blue}═══ Auto-fixes Applied ═══${colors.reset}`);
    autofixes.forEach((fix) => {
      console.error(`${colors.green}✨${colors.reset} ${fix}`);
    });
    console.error(
      `${colors.green}Automatically fixed ${autofixes.length} issue(s) for you!${colors.reset}`
    );
  }

  if (errors.length > 0) {
    console.error(`\n${colors.blue}═══ Quality Check Summary ═══${colors.reset}`);
    errors.forEach((error) => {
      const message = typeof error === 'string' ? error : error.message;
      console.error(`${colors.red}❌${colors.reset} ${message}`);
    });

    const blockingErrors = errors.filter(e => typeof e === 'object' && e.isBlocking);
    const nonBlockingErrors = errors.filter(e => typeof e === 'object' && !e.isBlocking);

    if (blockingErrors.length > 0) {
      console.error(
        `\n${colors.red}Found ${blockingErrors.length} blocking issue(s) that MUST be fixed!${colors.reset}`
      );
      console.error(`${colors.red}════════════════════════════════════════════${colors.reset}`);
      console.error(`${colors.red}❌ BLOCKING ISSUES MUST BE RESOLVED ❌${colors.reset}`);
      console.error(`${colors.red}════════════════════════════════════════════${colors.reset}`);
    }
    if (nonBlockingErrors.length > 0) {
      console.error(
        `\n${colors.yellow}Found ${nonBlockingErrors.length} non-blocking issue(s) (review recommended)${colors.reset}`
      );
    }
  }
}

async function main() {
  const hookVersion = config._fileConfig.version || '1.0.0';
  console.error('');
  console.error(`⚛️  React Quality Check v${hookVersion} - Starting...`);
  console.error('────────────────────────────────────────────');

  log.debug(`Loaded config: ${JSON.stringify(config, null, 2)}`);

  const input = await parseInput();
  const filePath = extractFilePath(input);

  if (!filePath) {
    log.warning('No file path found in input.');
    process.exit(0);
  }

  if (!(await fileExists(filePath))) {
    log.info(`File does not exist: ${filePath} (may have been deleted)`);
    process.exit(0);
  }

  if (!isSourceFile(filePath)) {
    log.info(`Skipping non-source file: ${filePath}`);
    console.error(`\n${colors.green}✅ No checks needed for ${path.basename(filePath)}${colors.reset}`);
    process.exit(0);
  }

  console.error('');
  console.error(`🔍 Validating: ${path.basename(filePath)}`);
  console.error('────────────────────────────────────────────');
  log.info(`Checking: ${filePath}`);

  // Acquire file lock to prevent race conditions
  const lock = new FileLock(filePath);
  const lockAcquired = await lock.acquire();

  if (!lockAcquired) {
    log.warning('Another quality check is running on this file. Skipping...');
    console.error(`\n${colors.yellow}⏭️  Skipped - another check in progress${colors.reset}`);
    process.exit(0);
  }

  try {
    const checker = new QualityChecker(filePath);
    const { errors, autofixes } = await checker.checkAll();

    printSummary(errors, autofixes);

    // Check for blocking errors using metadata
    const blockingErrors = errors.filter(e => typeof e === 'object' && e.isBlocking);

    if (blockingErrors.length > 0) {
      console.error(`\n${colors.red}🛑 FAILED - Fix issues in your edited file! 🛑${colors.reset}`);
      console.error(`${colors.yellow}📋 NEXT STEPS:${colors.reset}`);
      console.error(`${colors.yellow}   1. Fix the issues listed above${colors.reset}`);
      console.error(`${colors.yellow}   2. The hook will run again automatically${colors.reset}`);
      process.exit(2);
    } else {
      console.error(
        `\n${colors.green}✅ Quality check passed for ${path.basename(filePath)}${colors.reset}`
      );

      if (autofixes.length > 0 && config.autofixSilent) {
        console.error(
          `\n${colors.yellow}👉 File quality verified. Auto-fixes applied. Continue with your task.${colors.reset}`
        );
      } else {
        console.error(
          `\n${colors.yellow}👉 File quality verified. Continue with your task.${colors.reset}`
        );
      }
      process.exit(0);
    }
  } finally {
    await lock.release();
  }
}

process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
