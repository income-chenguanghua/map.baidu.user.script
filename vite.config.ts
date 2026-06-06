import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import packageJson from "./package.json";

const userscriptUrl =
  "https://github.com/income-chenguanghua/map.baidu.user.script/raw/refs/heads/main/dist/map-baidu-address-overrides.user.js";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "百度地图左侧地址本地修改",
        namespace: "local.bdmap.address.override",
        version: packageJson.version,
        description:
          "本地覆盖百度地图搜索结果左侧地址，刷新后继续按 POI uid 生效。",
        author: "chengguanghua",
        match: ["https://map.baidu.com/*"],
        grant: ["GM_getValue", "GM_setValue", "GM_addStyle"],
        updateURL: userscriptUrl,
        downloadURL: userscriptUrl,
        "run-at": "document-idle",
      },
      build: {
        fileName: "map-baidu-address-overrides.user.js",
        metaFileName: true,
      },
    }),
  ],
});
