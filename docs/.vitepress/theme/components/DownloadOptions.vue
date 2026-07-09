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
  | 'darwin-aarch64'
  | 'darwin-x86_64'
  | 'linux-x86_64-deb'
  | 'linux-x86_64-rpm'

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

const groups = computed(() => [
  {
    name: 'Windows',
    target: 'Windows 10 / 11',
    note: isZh.value
      ? '适合仓库、门店、收银台和办公电脑。'
      : 'For warehouse stations, stores, checkout counters, and office desktops.',
    items: [
      { label: '.exe', platformKey: 'windows-x86_64-nsis' },
      { label: '.msi', platformKey: 'windows-x86_64-msi' }
    ] satisfies DownloadItem[]
  },
  {
    name: 'macOS',
    target: 'Apple Silicon / Intel Silicon',
    note: isZh.value
      ? 'Apple Silicon 对应 M 系列芯片；Intel Silicon 对应 x86_64 设备。'
      : 'Apple Silicon is for M-series Macs; Intel Silicon is for x86_64 Macs.',
    items: [
      { label: 'Apple Silicon', platformKey: 'darwin-aarch64' },
      { label: 'Intel Silicon', platformKey: 'darwin-x86_64' }
    ] satisfies DownloadItem[]
  },
  {
    name: 'Linux',
    target: 'x86_64',
    note: isZh.value
      ? '需要系统已安装并启用 CUPS。'
      : 'Requires CUPS to be installed and enabled on the system.',
    items: [
      { label: '.deb', platformKey: 'linux-x86_64-deb' },
      { label: '.rpm', platformKey: 'linux-x86_64-rpm' }
    ] satisfies DownloadItem[]
  }
])

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

function isMissing(item: DownloadItem): boolean {
  return Boolean(manifest.value) && !manifest.value?.platforms[item.platformKey]?.url
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

    <div class="download-options">
      <article v-for="group in groups" :key="group.name" class="download-card">
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
            :class="{ missing: isMissing(item) }"
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
  background: var(--vp-c-brand-2);
}

.download-action.missing {
  background: var(--vp-c-text-3);
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
