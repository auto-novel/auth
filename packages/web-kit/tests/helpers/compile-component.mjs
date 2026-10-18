import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileScript, parse, registerTS } from 'vue/compiler-sfc';
import ts from 'typescript';

registerTS(() => ts);

// 编译真实组件，只替换调用方明确指定的依赖。
export function compileComponent(url, dependencies) {
  const filename = fileURLToPath(url);
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
  const { content } = compileScript(descriptor, {
    id: filename,
    inlineTemplate: true,
  });
  const { outputText } = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'HTMLElement', outputText)(
    (name) => {
      assert.ok(
        name in dependencies,
        `Unexpected component dependency: ${name}`,
      );
      return dependencies[name];
    },
    module,
    module.exports,
    class HTMLElement {},
  );
  return module.exports.default;
}
