# 高一3班 · 光荣榜

记录考试总分前三、进步前三,上榜同学手写签名即完成领奖。榜单和签名都**直接保存在 GitHub 仓库里**,所有打开网页的人看到同一份数据。

## 功能

- 🏆 总分前三 + 🚀 进步前三:仅显示名字和排名
- ✍️ 签名版:点击榜单名字或卡片,手写签名,保存即"已签名领奖"
- 🔒 教师管理:密码解锁后录入名单,点"保存到 GitHub"全班可见

## 文件结构

```
class3_ranking/
├── index.html      # 页面
├── style.css       # 样式
├── app.js          # 逻辑(榜单、签名、GitHub 读写)
└── config.js       # GitHub 配置 + 管理密码
```

## 一、配置 GitHub

1. 在 GitHub 新建一个仓库,如 `class3-data`(公开仓库,读取无需登录)
2. 生成写入令牌:
   - GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
   - **Generate new token** → 勾选 `repo` → 生成,复制令牌
3. 把以下内容填进 **`config.js`**:

```js
window.GITHUB_CONFIG = {
  owner: "你的GitHub用户名",
  repo: "class3-data",   // 数据仓库名
  branch: "main",
  path: "data.json",
  token: "ghp_xxxx",     // 你生成的令牌
  adminPass: "123456",   // 教师管理密码(可改)
};
```

> ⚠️ **安全提示**:令牌会随网页源码公开,任何看到网页的人都能用它修改数据。班级内部使用没问题,如担心可在用完后到 GitHub 撤销令牌。请勿把这个仓库用于其他重要数据。

## 二、部署

### GitHub Pages

1. 新建一个页面仓库(如 `class3-ranking`),上传 `class3_ranking` 全部文件(含 config.js)
2. **Settings → Pages** → Source 选 `main` 分支 → Save
3. 访问 `https://你的用户名.github.io/class3-ranking/`

### Netlify

1. <https://app.netlify.com> → **Add new site → Deploy manually** → 拖拽文件夹上传
2. 获得 `https://xxx.netlify.app` 地址

## 使用流程

1. 教师点 **🔒 教师管理** → 输入密码 → 录入两个榜单名字 → 点 **💾 保存到 GitHub**
2. 学生点击榜单名字或签名卡片 → 手写签名 → 保存(自动提交到 GitHub)
3. 所有人刷新页面即看到最新榜单和签名

## 本地测试

直接双击 `index.html` 即可,前提是 config.js 已填好。

> 提示:签名以图片(base64)形式存入 data.json,提交几次后文件会变大,属正常现象。若误删榜单,去 GitHub 仓库查看 `data.json` 的历史提交可以找回。
