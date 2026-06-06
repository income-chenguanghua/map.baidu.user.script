# 百度地图左侧地址本地修改

这是一个基于 `Vite + vite-plugin-monkey + TypeScript` 的 Tampermonkey 脚本项目。

脚本只修改本地浏览器里的百度地图左侧搜索结果 DOM，不会提交或修改百度地图真实数据。

## 功能

- 扫描百度地图左侧 `.poilist .search-item`
- 优先从“纠错”链接提取 `uid` 作为 POI 唯一标识
- 右下角显示 GitHub 风格“修改”入口
- 点击“修改”进入编辑模式，左侧每个识别到的结果项显示“修改地址”按钮
- 点击某条结果旁的“修改地址”按钮，打开脚本内编辑弹窗
- 弹窗可同时修改名称和地址，不依赖浏览器原生 `prompt`
- 右下角点击“完成”退出编辑模式，并隐藏每条结果旁的按钮
- 修改记录保存到 Tampermonkey 本地存储
- 页面刷新后自动读取记录并重新覆盖地址
- 输入空地址并确认可以恢复原始地址
- 无 `uid` 时兜底使用 `名称 + 原始地址`

## 项目结构

- `src/main.ts`
  脚本入口，只负责启动百度地图地址覆盖功能
- `src/features/baidu-address-overrides/index.ts`
  功能编排：扫描列表、监听 DOM 变化、切换编辑模式、处理编辑动作
- `src/features/baidu-address-overrides/dom.ts`
  百度地图列表 DOM 查询、uid 提取、地址渲染
- `src/features/baidu-address-overrides/editor-dialog.ts`
  GitHub 风格名称和地址编辑弹窗
- `src/features/baidu-address-overrides/storage.ts`
  Tampermonkey 本地存储读写
- `src/features/baidu-address-overrides/styles.ts`
  注入按钮和本地修改标记样式
- `src/features/baidu-address-overrides/status-widget.ts`
  右下角编辑模式入口
- `src/features/baidu-address-overrides/types.ts`
  功能内类型定义
- `vite.config.ts`
  userscript 元数据、匹配规则、grant 和输出文件配置

## 本地开发

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run typecheck
```

更新时间版本号：

```bash
make
```

## 安装到 Tampermonkey

构建后导入：

- `dist/map-baidu-address-overrides.user.js`

脚本匹配：

- `https://map.baidu.com/*`

## 存储格式

Tampermonkey 本地存储 key：

```txt
bdmap_poi_address_overrides_v1
```

记录结构：

```json
{
  "uid:6d1432ef7ee4cdd7ca09f00c": {
    "title": "你自己维护的新名称",
    "address": "你自己维护的新地址",
    "originalTitle": "百度地图原始名称",
    "originalAddress": "百度地图原始地址",
    "uid": "6d1432ef7ee4cdd7ca09f00c",
    "updatedAt": 1780640000000
  }
}
```
