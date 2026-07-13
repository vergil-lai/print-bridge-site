<script setup lang="ts">
import { Download } from '@lucide/vue'
import { useData, withBase } from 'vitepress'
import { computed, onMounted, ref } from 'vue'

const cachedManifestUrl = withBase('/releases/latest.json')
const releasesUrl = 'https://github.com/vergil-lai/print-bridge/releases'
const releaseUrl = 'https://github.com/vergil-lai/print-bridge/releases/latest'

type PlatformKey =
  | 'windows-x86_64-nsis'
  | 'windows-x86_64-msi'
  | 'darwin-aarch64-dmg'
  | 'darwin-x86_64-dmg'
  | 'linux-x86_64-deb'
  | 'linux-x86_64-rpm'
  | 'linux-x86_64-appimage'
  | 'linux-aarch64-deb'
  | 'linux-aarch64-rpm'
  | 'linux-aarch64-appimage'
  | 'linux-headless-x86_64-deb'
  | 'linux-headless-x86_64-rpm'
  | 'linux-headless-aarch64-deb'
  | 'linux-headless-aarch64-rpm'

interface LatestManifest {
  version: string
  pub_date?: string
  platforms: Partial<Record<PlatformKey, { url: string }>>
}

interface DownloadItem {
  label: string
  platformKey: PlatformKey
}

const manifest = ref<LatestManifest | null>(null)
const loading = ref(true)
const loadError = ref('')
const { lang } = useData()
const isZh = computed(() => lang.value === 'zh-CN')

const products = computed(() => [
  {
    name: isZh.value ? 'Desktop 桌面版' : 'Desktop',
    description: isZh.value
      ? '适用于 Windows、macOS 和带桌面环境的 Linux 工作站。'
      : 'For Windows, macOS, and Linux workstations with a desktop environment.',
    groups: [
      {
        name: 'Windows',
        target: 'Windows 10 / 11 · x64',
        note: isZh.value ? '推荐普通用户下载 .exe。' : 'The .exe installer is recommended for most users.',
        items: [
          { label: '.exe', platformKey: 'windows-x86_64-nsis' },
          { label: '.msi', platformKey: 'windows-x86_64-msi' }
        ] satisfies DownloadItem[]
      },
      {
        name: 'macOS',
        target: 'Apple Silicon / Intel',
        note: isZh.value
          ? 'M 系列芯片选择 Apple Silicon；Intel Mac 选择 Intel。'
          : 'Choose Apple Silicon for M-series Macs or Intel for Intel-based Macs.',
        items: [
          { label: 'Apple Silicon', platformKey: 'darwin-aarch64-dmg' },
          { label: 'Intel', platformKey: 'darwin-x86_64-dmg' }
        ] satisfies DownloadItem[]
      },
      {
        name: 'Linux x64',
        target: 'x86_64 / amd64',
        note: isZh.value ? '需要系统已安装并启用 CUPS。' : 'Requires CUPS to be installed and enabled.',
        items: [
          { label: '.deb', platformKey: 'linux-x86_64-deb' },
          { label: '.rpm', platformKey: 'linux-x86_64-rpm' },
          { label: 'AppImage', platformKey: 'linux-x86_64-appimage' }
        ] satisfies DownloadItem[]
      },
      {
        name: 'Linux ARM64',
        target: 'aarch64 / arm64',
        note: isZh.value ? '适用于 ARM64 Linux 桌面。' : 'For ARM64 Linux desktops.',
        items: [
          { label: '.deb', platformKey: 'linux-aarch64-deb' },
          { label: '.rpm', platformKey: 'linux-aarch64-rpm' },
          { label: 'AppImage', platformKey: 'linux-aarch64-appimage' }
        ] satisfies DownloadItem[]
      }
    ]
  },
  {
    name: 'Linux Headless',
    description: isZh.value
      ? '适用于服务器、树莓派、工控机和专用打印主机；安装后自动启用 systemd。'
      : 'For servers, Raspberry Pi devices, industrial PCs, and dedicated print hosts; systemd is enabled automatically.',
    groups: [
      {
        name: 'Headless x64',
        target: 'x86_64 / amd64',
        note: isZh.value ? '无 GUI，通过 CLI 配置和诊断。' : 'No GUI; configure and diagnose it through the CLI.',
        items: [
          { label: '.deb', platformKey: 'linux-headless-x86_64-deb' },
          { label: '.rpm', platformKey: 'linux-headless-x86_64-rpm' }
        ] satisfies DownloadItem[]
      },
      {
        name: 'Headless ARM64',
        target: 'aarch64 / arm64',
        note: isZh.value ? '无 GUI，通过 CLI 配置和诊断。' : 'No GUI; configure and diagnose it through the CLI.',
        items: [
          { label: '.deb', platformKey: 'linux-headless-aarch64-deb' },
          { label: '.rpm', platformKey: 'linux-headless-aarch64-rpm' }
        ] satisfies DownloadItem[]
      }
    ]
  }
])

const visibleProducts = computed(() =>
  products.value.map((product) => ({
    ...product,
    groups: product.groups.map((group) => ({
      ...group,
      items:
        manifest.value && !loadError.value
          ? group.items.filter((item) => manifest.value?.platforms[item.platformKey])
          : group.items
    }))
  }))
)

const versionLabel = computed(() =>
  manifest.value?.version ? `v${manifest.value.version}` : isZh.value ? '获取中' : 'Loading'
)
const publishDateLabel = computed(() => {
  if (!manifest.value?.pub_date) return ''

  return new Intl.DateTimeFormat(isZh.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(manifest.value.pub_date))
})

function downloadUrl(item: DownloadItem): string {
  return manifest.value?.platforms[item.platformKey]?.url ?? releaseUrl
}

onMounted(async () => {
  try {
    const response = await fetch(cachedManifestUrl, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    manifest.value = (await response.json()) as LatestManifest
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法获取最新版本'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="download-panel" aria-labelledby="download-version">
    <div class="download-head">
      <div>
        <p class="eyebrow">
          {{ isZh ? '最新版本' : 'Latest version' }}
          <span v-if="publishDateLabel" class="publish-date">
            {{ isZh ? '发布日期' : 'Published' }} {{ publishDateLabel }}
          </span>
        </p>
        <h2 id="download-version">{{ versionLabel }}</h2>
      </div>
      <a class="manifest-link" :href="releasesUrl" target="_blank" rel="noreferrer">
        GitHub Release
      </a>
    </div>

    <p v-if="loadError" class="download-error">
      {{
        isZh
          ? `暂时无法读取最新版本信息：${loadError}。下面按钮会先跳转到最新 Release 页面。`
          : `Unable to read the latest version: ${loadError}. The buttons below will open the latest Release page first.`
      }}
    </p>
    <p v-else-if="loading" class="download-muted">
      {{ isZh ? '正在读取最新版本信息...' : 'Loading latest version...' }}
    </p>

    <section v-for="product in visibleProducts" :key="product.name" class="download-product">
      <h2>{{ product.name }}</h2>
      <p>{{ product.description }}</p>
      <div class="download-options">
        <article v-for="group in product.groups" :key="group.name" class="download-card">
          <div class="download-body">
            <h3>{{ group.name }}</h3>
            <p class="download-target">{{ group.target }}</p>
            <p class="download-note">{{ group.note }}</p>
          </div>
          <div class="download-actions">
            <a
              v-for="item in group.items"
              :key="item.platformKey"
              class="download-action"
              :href="downloadUrl(item)"
              target="_blank"
              rel="noreferrer"
            >
              <Download :size="17" :stroke-width="2" />
              {{ item.label }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.download-panel {
  margin: 24px 0 32px;
}

.download-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
}

.publish-date {
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.download-head h2 {
  margin: 0;
  border-top: 0;
  padding-top: 0;
  font-size: 28px;
}

.manifest-link {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
}

.download-muted,
.download-error {
  margin: 0 0 16px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.download-error {
  color: var(--vp-c-danger-1);
}

.download-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.download-product + .download-product {
  margin-top: 32px;
}

.download-product > h2 {
  margin: 0;
  border-top: 0;
  padding-top: 0;
}

.download-product > p {
  margin: 6px 0 16px;
  color: var(--vp-c-text-2);
}

.download-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 22px;
  background: var(--vp-c-bg-soft);
}

.download-body {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.download-body h3 {
  margin: 0;
  font-size: 20px;
}

.download-target,
.download-note {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.download-note {
  line-height: 1.7;
}

.download-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.download-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 14px;
  color: #fff;
  background: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.download-action:hover {
  color: #fff;
  background: var(--vp-c-brand-2);
}

.download-action:focus-visible {
  color: #fff;
}

@media (max-width: 959px) {
  .download-options {
    grid-template-columns: 1fr;
  }

  .download-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
