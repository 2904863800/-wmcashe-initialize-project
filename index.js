// @ts-check
const path = require("node:path");
const inquirer = require("inquirer");
const { PACKAGES, PACKAGE, InitializeProject } = require("./src");

(async () => {
    try {
        // 填写项目名
        const r1 = await inquirer.prompt([
            {
                type: "input",
                name: "projectScoped",
                message: "请输入项目所属域 (please input project scoped)",
            },
        ]);
        const projectScoped = r1.projectScoped;
        // 填写项目名
        const r2 = await inquirer.prompt([
            {
                type: "input",
                name: "projectName",
                message: "请输入项目名称 (please input project name)",
            },
        ]);
        const projectName = r2.projectName;
        if (!projectName) {
            throw new Error(`必须填写项目名称`);
        }
        // 填写项目作者
        const r3 = await inquirer.prompt([
            {
                type: "input",
                name: "projectAuthor",
                message: "请输入项目作者 (please input project author)",
            },
        ]);
        const projectAuthor = r3.projectAuthor || "";
        // 填写项目描述
        const r4 = await inquirer.prompt([
            {
                type: "input",
                name: "projectDescription",
                message: "请输入项目描述 (please input project description)",
            },
        ]);
        const projectDescription = r4.projectDescription || "";
        // 是否需要生成测试文件夹
        const r5 = await inquirer.prompt([
            {
                type: "confirm",
                name: "isNeedTest",
                message: "是否需要生成测试文件夹 (is need to generate test folder)",
                default: true,
            },
        ]);
        const isNeedTest = r5.isNeedTest;
        const opt_1 = "单包模式 (package)";
        const opt_2 = "多包模式 (packages)";
        // 是否需要生成测试文件夹
        const r6 = await inquirer.prompt([
            {
                type: "rawlist",
                name: "codeOrganization",
                message: "代码组织方式 (code organization)",
                choices: [opt_1, opt_2],
            },
        ]);
        const codeOrganization = r6.codeOrganization === opt_1 ? PACKAGE : PACKAGES;

        const initializeProject = new InitializeProject();

        initializeProject.init(
            path.join(process.cwd(), projectName),
            {
                projectScoped,
                projectName,
                projectDescription,
                projectAuthor,
                isNeedTest,
            },
            codeOrganization,
        );
    } catch (error) {
        console.log(error);
    }
})();
