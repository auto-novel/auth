import { registerHooks } from 'node:module';

const sourceRoot = new URL('../../src/', import.meta.url).href;

// Node 直接运行源码时，为包内无扩展名的 TypeScript 导入补齐路径。
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      context.parentURL?.startsWith(sourceRoot)
    ) {
      return nextResolve(
        specifier === './theme' ? `${specifier}/index.ts` : `${specifier}.ts`,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});
