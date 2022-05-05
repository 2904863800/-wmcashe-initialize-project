// @ts-check
const fs = require("fs");

/**
 * 获取指定路径下的所有文件路径，包括子文件夹
 *
 * @param {string} targetPath 目标路径
 * @param {string[]} suffixes 指定后缀
 *
 * @returns {string[]} 获得的文件路径列表
 */
function __listAllFile(targetPath, suffixes = []) {
    if (!fs.existsSync(targetPath)) {
        return [];
    }
    const pathList = [];
    const needFilter = suffixes.length > 0;
    if (!fs.statSync(targetPath).isDirectory()) {
        if (needFilter) {
            const suffix = targetPath.slice(targetPath.lastIndexOf(".") + 1);
            if (suffixes.includes(suffix)) {
                pathList.push(targetPath);
            }
        } else {
            pathList.push(targetPath);
        }
        return pathList;
    }
    const files = fs.readdirSync(targetPath);
    for (const file of files) {
        let curPath = `${targetPath}/${file}`;
        if (fs.statSync(curPath).isDirectory()) {
            pathList.push(...__listAllFile(curPath, suffixes));
            continue;
        }

        if (!needFilter) {
            pathList.push(curPath);
            continue;
        }

        const suffix = curPath.slice(curPath.lastIndexOf(".") + 1);
        if (suffixes.includes(suffix)) {
            pathList.push(curPath);
        }
    }
    return pathList;
}

/**
 * 获取指定路径下的所有文件路径
 *
 * @param {string} targetPath 目标路径
 * @param {boolean} relative 获取相对路径
 * @param {string[]} suffixes 获取指定后缀的文件
 *
 * @returns {string[]} 获得的文件路径列表
 */
function listAllFile(targetPath, relative = true, suffixes = []) {
    const pathList = __listAllFile(targetPath, suffixes);
    return relative ? pathList.map((filePath) => filePath.slice(targetPath.length + 1)) : pathList;
}

/**
 * 清空文件夹
 *
 * @param {string} targetPath 目标路径
 * @param {boolean} include 删除目标路径
 *
 * @returns {void} void
 */
function deleteFolder(targetPath, include = false) {
    if (!fs.existsSync(targetPath)) {
        return;
    }
    if (!fs.statSync(targetPath).isDirectory()) {
        fs.unlinkSync(targetPath);
        return;
    }
    const files = fs.readdirSync(targetPath);
    for (const file of files) {
        const curPath = `${targetPath}/${file}`;
        if (fs.statSync(curPath).isDirectory()) {
            deleteFolder(curPath, true);
            continue;
        }
        fs.unlinkSync(curPath);
    }
    if (!include) {
        return;
    }
    fs.rmdirSync(targetPath);
}

/**
 * 检查文件夹，不存在就创建，存在则清空
 *
 * @param {string} targetPath 目标路径
 * @returns {void} void
 */
function checkFolderWithInitOrClear(targetPath) {
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
        console.log(`init target path ${targetPath}`);
        return;
    }
    deleteFolder(targetPath);
    console.log(`clear target path ${targetPath}`);
}

exports.listAllFile = listAllFile;
exports.deleteFolder = deleteFolder;
exports.checkFolderWithInitOrClear = checkFolderWithInitOrClear;
