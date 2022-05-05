#!/usr/bin/env node

// @ts-check

const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const { execSync } = require("child_process");
const { PACKAGE, PACKAGES } = require("./constants");
const { checkFolderWithInitOrClear } = require("./libs/fileHelper");

class InitializeProject {
    /**
     * 初始 package.json
     *
     * @param {string} rootPath 项目路径
     * @param {object} options 初始化参数
     * @param {string=} options.projectScoped 项目所属域
     * @param {string} options.projectName 项目名称
     * @param {string} options.projectDescription 项目描述
     * @param {string} options.projectAuthor 项目作者
     * @param {boolean} options.isNeedTest 是否需要生成测试目录
     * @param {PACKAGE|PACKAGES} mode 构建模式
     *
     * @returns {void} void
     */
    initPackageJson(rootPath, options, mode = PACKAGE) {
        execSync(`cd ${rootPath} && npm init -y`);
        const packageJsonPath = path.join(rootPath, "/package.json");
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`package.json 不存在 ${packageJsonPath}`);
        }
        if (options) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
            const { projectName, projectAuthor, projectDescription } = options;
            let name = "";
            if (options.projectScoped) {
                name += `@${options.projectScoped}/`;
            }
            name += projectName.toLowerCase();
            packageJson.name = name;
            projectAuthor && (packageJson.author = projectAuthor);
            projectDescription && (packageJson.description = projectDescription);
            if (mode === PACKAGES) {
                packageJson.private = true;
            }
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
        }
    }

    /**
     * 初始化 .gitignore
     *
     * @param {string} rootPath 项目路径
     */
    initGitignore(rootPath) {
        fs.writeFileSync(
            path.resolve(rootPath, ".gitignore"),
            ".vscode\n.cache\n.idea\n.project\nnode_modules\nsrc/**/.*\nbuild",
        );
    }

    /**
     * 初始化 .prettierrc
     *
     * @param {string} rootPath 项目路径
     */
    initPrettierrc(rootPath) {
        fs.writeFileSync(
            `${rootPath}/.prettierrc`,
            JSON.stringify(
                {
                    singleQuote: false,
                    trailingComma: "all",
                    printWidth: 100,
                    useTabs: false,
                    tabWidth: 4,
                    semi: true,
                    bracketSpacing: true,
                },
                null,
                4,
            ),
        );
    }

    /**
     * 拷贝 package.json
     *
     * @param {string} rootPath 项目路径
     * @param {object} options 初始化参数
     * @param {string=} options.projectScoped 项目所属域
     * @param {string} options.projectName 项目名称
     * @param {string} options.projectDescription 项目描述
     * @param {string} options.projectAuthor 项目作者
     * @param {boolean} options.isNeedTest 是否需要生成测试目录
     * @param {PACKAGE|PACKAGES} mode 构建模式
     *
     * @returns {void} void
     */
    copyPackageJson(rootPath, options, mode = PACKAGE) {
        if (mode === PACKAGE) {
            return;
        }
        const { projectScoped, projectName, isNeedTest } = options;
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(rootPath, "package.json")).toString(),
        );
        delete packageJson.scripts;
        delete packageJson.private;
        const basename = packageJson.name;
        packageJson.type = "commonjs";
        packageJson.main = "build/cjs/index.js";
        packageJson.types = "build/cjs/index.d.ts";
        packageJson.dependencies = {};
        packageJson.files = ["build"];
        packageJson.name = basename + "-typings";
        const typingsName = packageJson.name;
        fs.writeFileSync(
            path.resolve(rootPath, "packages/typings/package.json"),
            JSON.stringify(packageJson, null, 4),
        );
        packageJson.dependencies = {
            [typingsName]: `^${packageJson.version}`,
        };
        packageJson.name = basename + "-helpers";
        const helpersName = packageJson.name;
        packageJson.dependencies = {
            [typingsName]: `^${packageJson.version}`,
        };
        fs.writeFileSync(
            path.resolve(rootPath, "packages/helpers/package.json"),
            JSON.stringify(packageJson, null, 4),
        );
        packageJson.name = basename;
        const mainName = packageJson.name;
        packageJson.dependencies = {
            [helpersName]: `^${packageJson.version}`,
            [typingsName]: `^${packageJson.version}`,
        };
        const realProjectName = projectScoped
            ? projectName
            : projectName.includes("-")
            ? projectName.split("-").slice(1).join("-")
            : projectName;
        fs.writeFileSync(
            path.resolve(rootPath, `packages/${realProjectName}/package.json`),
            JSON.stringify(packageJson, null, 4),
        );
        if (isNeedTest) {
            packageJson.name = basename + "-test";
            packageJson.dependencies = {
                [mainName]: `^${packageJson.version}`,
            };
            fs.writeFileSync(
                path.resolve(rootPath, "packages/test/package.json"),
                JSON.stringify(packageJson, null, 4),
            );
        }
    }

    /**
     * 初始化 tsconfig.json
     *
     * @param {string} rootPath 项目路径
     * @param {boolean} isNeedTest 是否需要测试目录
     * @param {PACKAGE | PACKAGES} mode 构建模式
     *
     * @returns {void} void
     */
    initTsconfigJson(rootPath, isNeedTest, mode = PACKAGE) {
        execSync(`cd ${rootPath} && tsc --init`);
        const tsconfigPath = path.join(rootPath, "/tsconfig.json");
        if (!fs.existsSync(tsconfigPath)) {
            throw new Error(`tsconfig.json 不存在 ${tsconfigPath}`);
        }
        const tsconfigBase = JSON5.parse(fs.readFileSync(tsconfigPath).toString());
        tsconfigBase.compilerOptions.target = "ESNEXT";
        tsconfigBase.compilerOptions.module = "commonjs";
        tsconfigBase.compilerOptions.lib = [
            "ES5",
            "ES2015",
            "ES2016",
            "ES2017",
            "ES2018",
            "ES2019",
            "ES2020",
            "ES2021",
            "ESNEXT",
        ];
        tsconfigBase.compilerOptions.composite = true;
        tsconfigBase.compilerOptions.incremental = true;
        tsconfigBase.compilerOptions.declaration = true;
        tsconfigBase.compilerOptions.declarationMap = true;
        tsconfigBase.compilerOptions.sourceMap = true;
        tsconfigBase.compilerOptions.downlevelIteration = true;
        tsconfigBase.compilerOptions.removeComments = true;
        tsconfigBase.compilerOptions.forceConsistentCasingInFileNames = true;
        tsconfigBase.compilerOptions.importsNotUsedAsValues = "error";
        tsconfigBase.compilerOptions.strict = true;
        tsconfigBase.compilerOptions.strictNullChecks = true;
        tsconfigBase.compilerOptions.strictBindCallApply = true;
        tsconfigBase.compilerOptions.strictPropertyInitialization = true;
        tsconfigBase.compilerOptions.moduleResolution = "node";
        tsconfigBase.compilerOptions.esModuleInterop = true;
        tsconfigBase.compilerOptions.allowSyntheticDefaultImports = true;
        tsconfigBase.compilerOptions.experimentalDecorators = true;
        tsconfigBase.compilerOptions.emitDecoratorMetadata = true;
        tsconfigBase.compilerOptions.newLine = "lf";
        fs.writeFileSync(`${rootPath}/tsconfig.base.json`, JSON.stringify(tsconfigBase, null, 4));
        if (mode === PACKAGE) {
            const tsconfig = {
                files: [],
                include: [],
                exclude: ["build"],
                references: [{ path: "./src" }, { path: "./test" }],
            };
            fs.writeFileSync(`${rootPath}/tsconfig.json`, JSON.stringify(tsconfig, null, 4));
            const srcTsconfig = {
                extends: "../tsconfig.base",
                compilerOptions: {
                    rootDir: "./",
                    outDir: "../build/src",
                },
                files: ["@types.ts", "index.ts"],
            };
            fs.writeFileSync(`${rootPath}/src/tsconfig.json`, JSON.stringify(srcTsconfig, null, 4));
            if (isNeedTest) {
                const testTsconfig = {
                    extends: "../tsconfig.base",
                    compilerOptions: {
                        rootDir: "./",
                        outDir: "../build/test",
                    },
                    files: ["index.ts"],
                    references: [
                        {
                            path: "../src",
                        },
                    ],
                };
                fs.writeFileSync(
                    `${rootPath}/test/tsconfig.json`,
                    JSON.stringify(testTsconfig, null, 4),
                );
            }
            return;
        }
        const basename = path.basename(rootPath);
        const tsconfig = {
            files: [],
            include: [],
            references: [
                {
                    path: `./packages/${basename}/tsconfig.json`,
                },
            ],
        };
        if (isNeedTest) {
            tsconfig.references.push({ path: "./packages/test/tsconfig.json" });
        }
        fs.writeFileSync(`${rootPath}/tsconfig.json`, JSON.stringify(tsconfig, null, 4));
        const typingsTsconfig = {
            extends: "../../tsconfig.base",
            compilerOptions: {
                rootDir: "./src",
                outDir: "./build/cjs",
            },
            files: ["src/@types.ts", "src/index.ts"],
        };
        fs.writeFileSync(
            `${rootPath}/packages/typings/tsconfig.json`,
            JSON.stringify(typingsTsconfig, null, 4),
        );
        const helpersTsconfig = {
            extends: "../../tsconfig.base",
            compilerOptions: {
                rootDir: "./src",
                outDir: "./build/cjs",
            },
            references: [
                {
                    path: "../typings/tsconfig.json",
                },
            ],
            files: ["src/@types.ts", "src/index.ts"],
        };
        fs.writeFileSync(
            `${rootPath}/packages/helpers/tsconfig.json`,
            JSON.stringify(helpersTsconfig, null, 4),
        );
        const mainTsconfig = {
            extends: "../../tsconfig.base",
            compilerOptions: {
                rootDir: "./src",
                outDir: "./build/cjs",
            },
            references: [
                {
                    path: "../helpers/tsconfig.json",
                },
                {
                    path: "../typings/tsconfig.json",
                },
            ],
            files: ["src/@types.ts", "src/index.ts"],
        };
        fs.writeFileSync(
            `${rootPath}/packages/${basename}/tsconfig.json`,
            JSON.stringify(mainTsconfig, null, 4),
        );
        if (isNeedTest) {
            const testTsconfig = {
                extends: "../../tsconfig.base",
                compilerOptions: {
                    rootDir: "./src",
                    outDir: "./build/cjs",
                },
                references: [
                    {
                        path: `../${basename}/tsconfig.json`,
                    },
                ],
                files: [],
            };
            fs.writeFileSync(
                `${rootPath}/packages/test/tsconfig.json`,
                JSON.stringify(testTsconfig, null, 4),
            );
        }
    }

    /**
     * 初始化目录结构
     *
     * @param {string} rootPath 项目路径
     * @param {object} options 初始化参数
     * @param {string=} options.projectScoped 项目所属域
     * @param {string} options.projectName 项目名称
     * @param {string} options.projectDescription 项目描述
     * @param {string} options.projectAuthor 项目作者
     * @param {boolean} options.isNeedTest 是否需要生成测试目录
     * @param {PACKAGE|PACKAGES} mode 构建模式
     */
    initDirectory(rootPath, options, mode = PACKAGE) {
        checkFolderWithInitOrClear(path.join(rootPath, "/scripts"));

        const { projectScoped, projectName, isNeedTest } = options;
        const formatProjectName = projectName
            .split("-")
            .map((item) => item.replace(/^\S/, (s) => s.toUpperCase()))
            .join("");
        let projectNamespace = formatProjectName;
        if (projectScoped) {
            projectNamespace = projectScoped.toUpperCase() + projectNamespace;
        }

        const types = `declare namespace ${projectNamespace} {}`;

        if (mode === PACKAGE) {
            // 创建 src
            const srcPath = path.join(rootPath, "/src");
            checkFolderWithInitOrClear(srcPath);
            // 创建 @types.ts
            fs.writeFileSync(path.join(srcPath, "/@types.ts"), types);
            // 创建 index.ts
            fs.writeFileSync(path.join(srcPath, "index.ts"), `import "./@types";`);

            if (isNeedTest) {
                // 创建 test
                const testPath = path.join(rootPath, "/test");
                checkFolderWithInitOrClear(testPath);
                // 创建 index.ts
                fs.writeFileSync(path.join(testPath, "index.ts"), "欲渡黄河冰塞川，将登太行雪满山");
            }
            return;
        }
        const packagesRootPath = path.join(rootPath, "/packages");
        checkFolderWithInitOrClear(packagesRootPath);

        /**
         *
         * @param {string} targetRootPath 目标根目录
         */
        const initDir = (targetRootPath) => {
            const srcPath = path.join(targetRootPath, "/src");
            checkFolderWithInitOrClear(srcPath);
        };

        const packageBaseBame = projectScoped
            ? `@${projectScoped}/${projectName.toLowerCase()}`
            : projectName.includes("-")
            ? `@${projectName.replace(/-/, "/").toLowerCase()}`
            : projectName.toLowerCase();

        const importTypings = `import "${packageBaseBame}-typings";\n\nimport "./@types";`;

        const typingsPath = path.join(packagesRootPath, "typings");
        initDir(typingsPath);
        // 创建 @types.ts
        fs.writeFileSync(path.join(typingsPath, "src/@types.ts"), types);
        // 创建 index.ts
        fs.writeFileSync(path.join(typingsPath, "src/index.ts"), `import "./@types";`);

        const helpersPath = path.join(packagesRootPath, "helpers");
        initDir(helpersPath);
        // 创建 @types.ts
        fs.writeFileSync(path.join(helpersPath, "src/@types.ts"), types);
        // 创建 index.ts
        fs.writeFileSync(path.join(helpersPath, "src/index.ts"), importTypings);

        const basename = path.basename(rootPath);
        const mainPath = path.join(packagesRootPath, basename);
        initDir(mainPath);
        // 创建 @types.ts
        fs.writeFileSync(path.join(mainPath, "src/@types.ts"), types);
        // 创建 index.ts
        fs.writeFileSync(path.join(mainPath, "src/index.ts"), importTypings);

        if (isNeedTest) {
            initDir(path.join(packagesRootPath, "test"));
        }
    }

    /**
     * 初始化项目
     *
     * @param {string} rootPath 项目路径
     * @param {object} options 初始化参数
     * @param {string=} options.projectScoped 项目所属域
     * @param {string=} options.projectName 项目名称
     * @param {string} options.projectDescription 项目描述
     * @param {string} options.projectAuthor 项目作者
     * @param {boolean} options.isNeedTest 是否需要生成测试目录
     * @param {PACKAGE|PACKAGES} mode 构建模式
     *
     * @returns {void} void
     */
    init(rootPath, options, mode = PACKAGE) {
        let basename = path.basename(rootPath);
        if (!options.projectScoped && basename.includes("-")) {
            options.projectScoped = basename.split("-")[0];
            basename = basename.split("-").slice(1).join("-");
        }

        checkFolderWithInitOrClear(rootPath);

        const opts = {
            ...options,
            projectScoped: options.projectScoped,
            projectName: options.projectName || basename,
        };

        // 生成 package.json
        this.initPackageJson(rootPath, opts, mode);

        // 生成 .gitignore
        this.initGitignore(rootPath);

        // 生成 .prettierrc
        this.initPrettierrc(rootPath);

        const isNeedTest = options.isNeedTest;

        // 初始化目录结构
        this.initDirectory(rootPath, opts, mode);

        // 生成 tsconfig.json
        this.initTsconfigJson(rootPath, isNeedTest, mode);

        // 拷贝 package.json
        this.copyPackageJson(rootPath, opts, mode);
    }
}

exports.InitializeProject = InitializeProject;
