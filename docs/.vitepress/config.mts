import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'PrintBridge',
    description: '开源本机打印 Agent，让 Web 应用稳定下发静默打印',
    head: [['link', { rel: 'icon', type: 'image/png', href: '/brand/app-icon.png' }]],
    locales: {
        root: {
            label: 'English',
            lang: 'en',
            title: 'PrintBridge',
            description: 'Open-source local print agent for web applications',
            themeConfig: {
                logo: {
                    src: '/brand/app-icon.png',
                    alt: 'PrintBridge',
                },
                nav: [
                    { text: 'Home', link: '/' },
                    { text: 'Download', link: '/download' },
                    { text: 'Quick Start', link: '/guide/getting-started' },
                    { text: 'SDK', link: '/guide/sdk' },
                    { text: 'Remote Tasks', link: '/guide/remote-tasks' },
                    { text: 'Deployment', link: '/guide/deployment' },
                    { text: 'Technical Docs', link: '/technical' },
                    { text: '中文', link: '/zh-CN/' },
                ],
                sidebar: {
                    '/': [
                        {
                            text: 'Get Started',
                            items: [
                                { text: 'Download', link: '/download' },
                                { text: 'Quick Start', link: '/guide/getting-started' },
                                { text: 'SDK Integration', link: '/guide/sdk' },
                                { text: 'Remote Tasks', link: '/guide/remote-tasks' },
                            ],
                        },
                        {
                            text: 'Deployment and Security',
                            items: [
                                { text: 'Deployment and Configuration', link: '/guide/deployment' },
                                { text: 'Security Boundaries', link: '/guide/security' },
                            ],
                        },
                        {
                            text: 'Reference',
                            items: [{ text: 'Technical Docs', link: '/technical' }],
                        },
                    ],
                },
            },
        },
        'zh-CN': {
            label: '中文',
            lang: 'zh-CN',
            title: 'PrintBridge',
            description: '开源本机打印 Agent，让 Web 应用稳定下发静默打印',
            themeConfig: {
                logo: {
                    src: '/brand/app-icon.png',
                    alt: 'PrintBridge',
                },
                nav: [
                    { text: '首页', link: '/zh-CN/' },
                    { text: '下载', link: '/zh-CN/download' },
                    { text: '快速开始', link: '/zh-CN/guide/getting-started' },
                    { text: 'SDK 接入', link: '/zh-CN/guide/sdk' },
                    { text: '远程任务', link: '/zh-CN/guide/remote-tasks' },
                    { text: '部署', link: '/zh-CN/guide/deployment' },
                    { text: '技术文档', link: '/zh-CN/technical' },
                ],
                sidebar: {
                    '/zh-CN/': [
                        {
                            text: '开始使用',
                            items: [
                                { text: '下载', link: '/zh-CN/download' },
                                { text: '快速开始', link: '/zh-CN/guide/getting-started' },
                                { text: 'SDK 接入', link: '/zh-CN/guide/sdk' },
                                { text: '远程任务', link: '/zh-CN/guide/remote-tasks' },
                            ],
                        },
                        {
                            text: '部署与安全',
                            items: [
                                { text: '部署与配置', link: '/zh-CN/guide/deployment' },
                                { text: '安全边界', link: '/zh-CN/guide/security' },
                            ],
                        },
                        {
                            text: '技术参考',
                            items: [{ text: '技术文档', link: '/zh-CN/technical' }],
                        },
                    ],
                },
            },
        },
    },
    themeConfig: {
        logo: {
            src: '/brand/app-icon.png',
            alt: 'PrintBridge',
        },
        nav: [
            { text: 'Home', link: '/' },
            { text: '中文', link: '/zh-CN/' },
        ],
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/vergil-lai/print-bridge',
            },
        ],
    },
});
