import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("demo declares the published SDK as a production dependency", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.match(
    packageJson.dependencies?.["print-bridge-sdk"] ?? "",
    /^\^?\d+\.\d+\.\d+$/,
  );
});

test("demo publishes one same-origin sample for every supported format", async () => {
  for (const extension of ["pdf", "jpg", "html", "docx"]) {
    await access(
      new URL(`docs/public/demo/printbridge-a4-sample.${extension}`, root),
    );
  }
});

test("demo pages omit the integration tutorial and mount the live component", async () => {
  for (const path of ["docs/demo.md", "docs/zh-CN/demo.md"]) {
    const page = await read(path);

    assert.doesNotMatch(page, /npm install print-bridge-sdk/);
    assert.doesNotMatch(page, /Install in a Vue project|在 Vue 项目中安装/);
    assert.match(page, /<PrintDemo\s*\/>/);
  }
});

test("shared demo component covers printers, paper, and all four formats", async () => {
  const component = await read(
    "docs/.vitepress/theme/components/PrintDemo.vue",
  );

  assert.match(component, /getPrintersList\(\)/);
  assert.match(component, /getPrinterInfo\(/);
  for (const type of ["pdf", "image", "html", "docx"]) {
    assert.match(component, new RegExp(`key: ["']${type}["']`));
  }
  assert.match(component, /type: file\.key/);
  assert.match(component, /printerName:/);
  assert.match(component, /paper:/);
  assert.match(component, /new URL\(/);
});

test("navigation places the localized live demo directly after home", async () => {
  const theme = await read("docs/.vitepress/theme/index.ts");
  const config = await read("docs/.vitepress/config.mts");

  assert.match(theme, /PrintDemo/);
  assert.match(
    config,
    /\{ text: "Home", link: "\/" \},\s*\{ text: "Live Demo", link: "\/demo" \}/,
  );
  assert.match(
    config,
    /\{ text: "首页", link: "\/zh-CN\/" \},\s*\{ text: "在线示例", link: "\/zh-CN\/demo" \}/,
  );
  assert.match(config, /\{ text: "Live Demo", link: "\/demo" \}/);
  assert.match(config, /\{ text: "在线示例", link: "\/zh-CN\/demo" \}/);
});

test("home page secondary actions open the localized live demo", async () => {
  const englishHome = await read("docs/index.md");
  const chineseHome = await read("docs/zh-CN/index.md");

  assert.match(englishHome, /text: View Live Demo\s+link: \/demo/);
  assert.match(chineseHome, /text: 查看在线示例\s+link: \/zh-CN\/demo/);
});
