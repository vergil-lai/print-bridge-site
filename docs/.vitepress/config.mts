import { defineConfig } from "vitepress";

const siteUrl = "https://printbridge.pages.dev";
const siteImage = `${siteUrl}/screenshots/1.png`;

function urlPathFromRelativePath(relativePath: string) {
  if (relativePath === "index.md") return "";
  if (relativePath.endsWith("/index.md")) {
    return relativePath.replace(/index\.md$/, "");
  }

  return relativePath.replace(/\.md$/, ".html");
}

function canonicalUrl(relativePath: string) {
  const path = urlPathFromRelativePath(relativePath);

  return path ? `${siteUrl}/${path}` : `${siteUrl}/`;
}

function alternatePath(relativePath: string, locale: "en" | "zh-CN") {
  const withoutLocale = relativePath.replace(/^zh-CN\//, "");

  if (locale === "zh-CN") {
    return withoutLocale === "index.md"
      ? "zh-CN/index.md"
      : `zh-CN/${withoutLocale}`;
  }

  return withoutLocale;
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "PrintBridge",
  description: "开源本机打印 Agent，让 Web 应用稳定下发静默打印",
  sitemap: {
    hostname: siteUrl,
  },
  head: [
    ["link", { rel: "icon", type: "image/png", href: "/brand/app-icon.png" }],
  ],
  transformPageData(pageData) {
    const title = pageData.title
      ? `${pageData.title} | PrintBridge`
      : "PrintBridge";
    const description =
      pageData.description ||
      pageData.frontmatter.description ||
      "PrintBridge is an open-source local print agent for web applications.";
    const url = canonicalUrl(pageData.relativePath);
    const enUrl = canonicalUrl(alternatePath(pageData.relativePath, "en"));
    const zhUrl = canonicalUrl(alternatePath(pageData.relativePath, "zh-CN"));

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ["link", { rel: "canonical", href: url }],
      ["link", { rel: "alternate", hreflang: "en", href: enUrl }],
      ["link", { rel: "alternate", hreflang: "zh-CN", href: zhUrl }],
      ["link", { rel: "alternate", hreflang: "x-default", href: enUrl }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: "PrintBridge" }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:image", content: siteImage }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: siteImage }],
    );
  },
  locales: {
    root: {
      label: "English",
      lang: "en",
      title:
        "PrintBridge - Open Source Silent Printing Agent for Web Applications",
      description:
        "PrintBridge is an open-source local print agent that enables silent printing from web applications to local printers. Supports PDF, Office, ESC/POS, ZPL and raw printer commands.",
      themeConfig: {
        logo: {
          src: "/brand/app-icon.png",
          alt: "PrintBridge",
        },
        nav: [
          { text: "Home", link: "/" },
          { text: "Download", link: "/download" },
          { text: "Quick Start", link: "/guide/getting-started" },
          { text: "SDK", link: "/guide/sdk" },
          { text: "Remote Tasks", link: "/guide/remote-tasks" },
          { text: "Deployment", link: "/guide/deployment" },
          { text: "Technical Docs", link: "/technical" },
        ],
        sidebar: {
          "/": [
            {
              text: "Get Started",
              items: [
                { text: "Download", link: "/download" },
                { text: "Quick Start", link: "/guide/getting-started" },
                { text: "SDK Integration", link: "/guide/sdk" },
                { text: "Remote Tasks", link: "/guide/remote-tasks" },
              ],
            },
            {
              text: "Deployment and Security",
              items: [
                {
                  text: "Deployment and Configuration",
                  link: "/guide/deployment",
                },
                { text: "Security Boundaries", link: "/guide/security" },
              ],
            },
            {
              text: "Reference",
              items: [{ text: "Technical Docs", link: "/technical" }],
            },
          ],
        },
      },
    },
    "zh-CN": {
      label: "中文",
      lang: "zh-CN",
      title: "PrintBridge - 开源 Web 静默打印代理",
      description:
        "PrintBridge 是一个开源本地打印代理，让 Web 应用实现向本地打印机的静默打印。支持 PDF、Office 文档、ESC/POS、ZPL 以及原始打印指令。",
      themeConfig: {
        logo: {
          src: "/brand/app-icon.png",
          alt: "PrintBridge",
        },
        nav: [
          { text: "首页", link: "/zh-CN/" },
          { text: "下载", link: "/zh-CN/download" },
          { text: "快速开始", link: "/zh-CN/guide/getting-started" },
          { text: "SDK 接入", link: "/zh-CN/guide/sdk" },
          { text: "远程任务", link: "/zh-CN/guide/remote-tasks" },
          { text: "部署", link: "/zh-CN/guide/deployment" },
          { text: "技术文档", link: "/zh-CN/technical" },
        ],
        sidebar: {
          "/zh-CN/": [
            {
              text: "开始使用",
              items: [
                { text: "下载", link: "/zh-CN/download" },
                { text: "快速开始", link: "/zh-CN/guide/getting-started" },
                { text: "SDK 接入", link: "/zh-CN/guide/sdk" },
                { text: "远程任务", link: "/zh-CN/guide/remote-tasks" },
              ],
            },
            {
              text: "部署与安全",
              items: [
                { text: "部署与配置", link: "/zh-CN/guide/deployment" },
                { text: "安全边界", link: "/zh-CN/guide/security" },
              ],
            },
            {
              text: "技术参考",
              items: [{ text: "技术文档", link: "/zh-CN/technical" }],
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    logo: {
      src: "/brand/app-icon.png",
      alt: "PrintBridge",
    },
    nav: [{ text: "Home", link: "/" }],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/vergil-lai/print-bridge",
      },
    ],
  },
});
