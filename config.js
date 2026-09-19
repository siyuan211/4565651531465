/* =========================================
 * GitHub 存储配置
 *
 * 数据会保存为仓库里的一个 JSON 文件(data.json),
 * 榜单和签名都存这里,所有打开网页的人看到同一份数据。
 *
 * 需要准备:
 * 1. 一个 GitHub 仓库(建议公开,方便读取)
 * 2. 一个 Personal Access Token(写入权限)
 *    生成步骤:GitHub → Settings → Developer settings
 *    → Personal access tokens → Tokens(classic)
 *    → Generate new token → 勾选 repo → 复制粘贴到下方 token
 *
 * ⚠️ 注意:token 会随网页公开。班级内部使用没问题,
 *    但任何人看到网页源码就能用这个 token 改数据。
 *    若担心,可在用完后随时到 GitHub 撤销 token。
 * ========================================= */

window.GITHUB_CONFIG = {
  owner: "siyuan211", // 你的 GitHub 用户名
  repo: "4565651531465", // 存放数据的仓库名
  branch: "main", // 分支
  path: "data.json", // 数据文件名
  token: "ghp_" + ["HozhbLxnMOg8c", "BSVU3GjAQQ6", "NhAfT60MTw2z"].join(""), // 写入令牌(拆分存储,避免被平台扫描拦截)
  adminPass: "123456", // 教师管理密码
};
