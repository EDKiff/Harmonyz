const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Keep the behavioral tests runnable with Node and the project's existing TypeScript compiler.
function loadFile(filename) {
    const loaded = new Module(filename, module);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    const originalRequire = loaded.require.bind(loaded);
    loaded.require = (specifier) => {
        if (specifier.startsWith(".")) {
            const source = path.resolve(path.dirname(filename), specifier + ".ts");
            if (fs.existsSync(source)) return loadFile(source);
        }
        return originalRequire(specifier);
    };
    loaded._compile(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        filename,
    );
    return loaded.exports;
}

module.exports = function loadTypeScript(relativePath) {
    return loadFile(path.resolve(__dirname, "..", relativePath));
};
