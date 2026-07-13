<script setup lang="ts">
import { PrintBridgeClient, PrintBridgeError } from 'print-bridge-sdk'
import type {
  PrintBridgeJobStatus,
  PrintBridgePrinter,
  PrintBridgePrinterPaper,
  PrintBridgeStatusEvent
} from 'print-bridge-sdk/types'
import { useData, withBase } from 'vitepress'
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

type DemoFormat = 'pdf' | 'image' | 'html' | 'docx'
type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface DemoFile {
  key: DemoFormat
  extension: 'PDF' | 'JPG' | 'HTML' | 'DOCX'
  url: string
  sampleUrl: string
  status: PrintBridgeJobStatus | 'submitting' | ''
  error: string
}

interface LogEntry {
  id: number
  time: string
  message: string
  tone: 'default' | 'success' | 'error'
}

const fallbackPaper: PrintBridgePrinterPaper = {
  name: 'A4',
  widthMm: 210,
  heightMm: 297
}
const terminalStatuses = new Set<PrintBridgeJobStatus>([
  'completed',
  'failed',
  'cancelled'
])

const { lang } = useData()
const isZh = computed(() => lang.value === 'zh-CN')
const copy = computed(() =>
  isZh.value
    ? {
        connect: '连接 Agent',
        reconnect: '重新连接',
        connecting: '正在连接...',
        connected: '已连接',
        disconnected: '未连接',
        connectionHelp: '请先启动 PrintBridge Agent，并将当前官网 Origin 加入白名单。',
        printer: '打印机',
        printerPlaceholder: '请选择打印机',
        noPrinters: 'Agent 没有返回可用打印机。',
        paper: '纸张尺寸',
        paperLoading: '正在读取纸张...',
        sample: '内置样例',
        customUrl: '公网文件 URL',
        resetSample: '恢复内置样例',
        print: '打印',
        notReady: '请先连接 Agent，并选择打印机和纸张。',
        invalidUrl: '请输入有效的 HTTP/HTTPS 文件地址。',
        logs: '运行日志',
        noLogs: '连接和打印状态会显示在这里。',
        submittedHint: 'submitted 表示任务已提交到系统打印队列，不代表打印机已完成出纸。',
        fallbackPaper: '打印机未返回纸张，已使用 A4 默认尺寸。',
        connectionReady: 'Agent 连接成功。',
        printerLoaded: (count: number) => `已加载 ${count} 台打印机。`,
        queued: (format: string) => `${format} 任务已进入队列。`,
        status: (format: string, status: string) => `${format} 任务状态：${status}`,
        resetDone: (format: string) => `${format} 已恢复内置样例。`
      }
    : {
        connect: 'Connect Agent',
        reconnect: 'Reconnect',
        connecting: 'Connecting...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        connectionHelp: 'Start PrintBridge Agent and add this website Origin to its allowlist first.',
        printer: 'Printer',
        printerPlaceholder: 'Select a printer',
        noPrinters: 'The Agent did not return any printers.',
        paper: 'Paper size',
        paperLoading: 'Loading paper sizes...',
        sample: 'Built-in sample',
        customUrl: 'Public file URL',
        resetSample: 'Restore sample',
        print: 'Print',
        notReady: 'Connect to the Agent and select a printer and paper size first.',
        invalidUrl: 'Enter a valid HTTP/HTTPS file URL.',
        logs: 'Activity log',
        noLogs: 'Connection and print status will appear here.',
        submittedHint: 'submitted means the job reached the system print queue, not that physical printing is complete.',
        fallbackPaper: 'The printer returned no paper sizes. A4 is being used as the default.',
        connectionReady: 'Connected to the Agent.',
        printerLoaded: (count: number) => `Loaded ${count} printer${count === 1 ? '' : 's'}.`,
        queued: (format: string) => `${format} job queued.`,
        status: (format: string, status: string) => `${format} job status: ${status}`,
        resetDone: (format: string) => `${format} restored to the built-in sample.`
      }
)

const client = shallowRef<PrintBridgeClient | null>(null)
const connectionState = ref<ConnectionState>('disconnected')
const connectionError = ref('')
const printers = ref<PrintBridgePrinter[]>([])
const selectedPrinterName = ref('')
const papers = ref<PrintBridgePrinterPaper[]>([])
const selectedPaperIndex = ref(0)
const loadingPapers = ref(false)
const logs = ref<LogEntry[]>([])
const pendingJobs = new Map<string, DemoFormat>()
const unsubscribeHandlers: Array<() => void> = []
let listenersBound = false
let logSequence = 0

const files = ref<DemoFile[]>([
  {
    key: 'pdf',
    extension: 'PDF',
    url: withBase('/demo/printbridge-a4-sample.pdf'),
    sampleUrl: withBase('/demo/printbridge-a4-sample.pdf'),
    status: '',
    error: ''
  },
  {
    key: 'image',
    extension: 'JPG',
    url: withBase('/demo/printbridge-a4-sample.jpg'),
    sampleUrl: withBase('/demo/printbridge-a4-sample.jpg'),
    status: '',
    error: ''
  },
  {
    key: 'html',
    extension: 'HTML',
    url: withBase('/demo/printbridge-a4-sample.html'),
    sampleUrl: withBase('/demo/printbridge-a4-sample.html'),
    status: '',
    error: ''
  },
  {
    key: 'docx',
    extension: 'DOCX',
    url: withBase('/demo/printbridge-a4-sample.docx'),
    sampleUrl: withBase('/demo/printbridge-a4-sample.docx'),
    status: '',
    error: ''
  }
])

function addLog(message: string, tone: LogEntry['tone'] = 'default') {
  logs.value.unshift({
    id: ++logSequence,
    time: new Intl.DateTimeFormat(isZh.value ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date()),
    message,
    tone
  })
}

function describeError(error: unknown): string {
  if (error instanceof PrintBridgeError) {
    return `${error.code}: ${error.message}`
  }

  return error instanceof Error ? error.message : String(error)
}

function bindClientEvents(activeClient: PrintBridgeClient) {
  if (listenersBound) return

  listenersBound = true
  unsubscribeHandlers.push(
    activeClient.on('status', handleStatus),
    activeClient.on('disconnect', () => {
      connectionState.value = 'disconnected'
      addLog(copy.value.disconnected, 'error')
    }),
    activeClient.on('error', (error) => addLog(describeError(error), 'error'))
  )
}

function handleStatus(event: PrintBridgeStatusEvent) {
  const format = pendingJobs.get(event.jobId)
  if (!format) return

  const file = files.value.find((item) => item.key === format)
  if (!file) return

  file.status = event.status
  if (event.status === 'failed' && event.message) {
    file.error = event.message
  }
  addLog(
    `${copy.value.status(file.extension, event.status)}${event.message ? ` — ${event.message}` : ''}`,
    event.status === 'failed' ? 'error' : event.status === 'completed' ? 'success' : 'default'
  )

  if (terminalStatuses.has(event.status)) {
    pendingJobs.delete(event.jobId)
  }
}

async function connectAgent() {
  connectionState.value = 'connecting'
  connectionError.value = ''

  try {
    client.value ??= new PrintBridgeClient({
      ip: '127.0.0.1',
      port: 17890,
      connectTimeoutMs: 3000,
      requestTimeoutMs: 5000
    })
    bindClientEvents(client.value)

    if (client.value.isConnected()) {
      client.value.disconnect()
    }

    await client.value.connect()
    await client.value.ping()
    printers.value = await client.value.getPrintersList()
    selectedPrinterName.value =
      printers.value.find((printer) => printer.isDefault)?.name ?? printers.value[0]?.name ?? ''
    connectionState.value = 'connected'
    addLog(copy.value.connectionReady, 'success')
    addLog(copy.value.printerLoaded(printers.value.length))

    await loadPrinterPapers()
  } catch (error) {
    client.value?.disconnect()
    connectionState.value = 'disconnected'
    connectionError.value = describeError(error)
    addLog(connectionError.value, 'error')
  }
}

async function loadPrinterPapers() {
  if (!client.value || !selectedPrinterName.value) {
    papers.value = []
    return
  }

  loadingPapers.value = true
  try {
    const printer = await client.value.getPrinterInfo(selectedPrinterName.value)
    papers.value = printer.papers.length > 0 ? printer.papers : [{ ...fallbackPaper }]
    selectedPaperIndex.value = 0

    if (printer.papers.length === 0) {
      addLog(copy.value.fallbackPaper)
    }
  } catch (error) {
    papers.value = [{ ...fallbackPaper }]
    selectedPaperIndex.value = 0
    addLog(`${describeError(error)} ${copy.value.fallbackPaper}`, 'error')
  } finally {
    loadingPapers.value = false
  }
}

function paperLabel(paper: PrintBridgePrinterPaper): string {
  const name = paper.name?.trim() || paper.id?.trim() || 'Paper'
  return `${name} · ${paper.widthMm} × ${paper.heightMm} mm`
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value, window.location.href)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function resetSample(file: DemoFile) {
  file.url = file.sampleUrl
  file.error = ''
  addLog(copy.value.resetDone(file.extension))
}

function isPrinting(file: DemoFile): boolean {
  return ['submitting', 'queued', 'downloading', 'printing'].includes(file.status)
}

async function printFile(file: DemoFile) {
  const selectedPaper = papers.value[selectedPaperIndex.value]
  if (
    !client.value ||
    connectionState.value !== 'connected' ||
    !selectedPrinterName.value ||
    !selectedPaper
  ) {
    file.error = copy.value.notReady
    return
  }

  const fileUrl = normalizeHttpUrl(file.url)
  if (!fileUrl) {
    file.error = copy.value.invalidUrl
    return
  }

  file.error = ''
  file.status = 'submitting'
  const requestId = crypto.randomUUID()
  const jobId = crypto.randomUUID()
  pendingJobs.set(jobId, file.key)

  try {
    const accepted = await client.value.print({
      requestId,
      jobId,
      type: file.key,
      printerName: selectedPrinterName.value,
      fileUrl,
      copies: 1,
      paper: {
        widthMm: selectedPaper.widthMm,
        heightMm: selectedPaper.heightMm
      }
    })
    file.status = accepted.status
    addLog(copy.value.queued(file.extension), 'success')
  } catch (error) {
    pendingJobs.delete(jobId)
    file.status = 'failed'
    file.error = describeError(error)
    addLog(`${file.extension}: ${file.error}`, 'error')
  }
}

onBeforeUnmount(() => {
  for (const unsubscribe of unsubscribeHandlers) unsubscribe()
  client.value?.disconnect()
})
</script>

<template>
  <section class="print-demo" aria-labelledby="print-demo-title">
    <div class="demo-heading">
      <div>
        <p class="demo-eyebrow">Live Demo</p>
        <h2 id="print-demo-title">PrintBridge Agent</h2>
        <p>{{ copy.connectionHelp }}</p>
      </div>
      <div class="connection-actions">
        <span class="connection-state" :class="`is-${connectionState}`">
          {{ copy[connectionState] }}
        </span>
        <button type="button" :disabled="connectionState === 'connecting'" @click="connectAgent">
          {{
            connectionState === 'connecting'
              ? copy.connecting
              : connectionState === 'connected'
                ? copy.reconnect
                : copy.connect
          }}
        </button>
      </div>
    </div>

    <p v-if="connectionError" class="demo-error">{{ connectionError }}</p>

    <div class="device-grid">
      <label>
        <span>{{ copy.printer }}</span>
        <select
          v-model="selectedPrinterName"
          :disabled="connectionState !== 'connected' || printers.length === 0"
          @change="loadPrinterPapers"
        >
          <option value="">{{ copy.printerPlaceholder }}</option>
          <option v-for="printer in printers" :key="printer.name" :value="printer.name">
            {{ printer.name }}{{ printer.isDefault ? ' · Default' : '' }}
          </option>
        </select>
        <small v-if="connectionState === 'connected' && printers.length === 0">
          {{ copy.noPrinters }}
        </small>
      </label>

      <label>
        <span>{{ copy.paper }}</span>
        <select
          v-model.number="selectedPaperIndex"
          :disabled="connectionState !== 'connected' || loadingPapers || papers.length === 0"
        >
          <option v-for="(paper, index) in papers" :key="`${paper.id ?? paper.name}-${index}`" :value="index">
            {{ paperLabel(paper) }}
          </option>
        </select>
        <small v-if="loadingPapers">{{ copy.paperLoading }}</small>
      </label>
    </div>

    <div class="format-grid">
      <article v-for="file in files" :key="file.key" class="format-card">
        <div class="format-head">
          <div>
            <span>{{ copy.sample }}</span>
            <h3>{{ file.extension }}</h3>
          </div>
          <span v-if="file.status" class="job-status" :class="`is-${file.status}`">
            {{ file.status }}
          </span>
        </div>

        <label>
          <span>{{ copy.customUrl }}</span>
          <input v-model.trim="file.url" type="url" inputmode="url" spellcheck="false" />
        </label>

        <p v-if="file.error" class="demo-error">{{ file.error }}</p>

        <div class="format-actions">
          <button type="button" class="secondary" @click="resetSample(file)">
            {{ copy.resetSample }}
          </button>
          <button
            type="button"
            :disabled="
              connectionState !== 'connected' ||
              loadingPapers ||
              !selectedPrinterName ||
              papers.length === 0 ||
              isPrinting(file)
            "
            @click="printFile(file)"
          >
            {{ copy.print }} {{ file.extension }}
          </button>
        </div>
      </article>
    </div>

    <section class="activity" :aria-labelledby="`activity-${isZh ? 'zh' : 'en'}`">
      <div class="activity-head">
        <h3 :id="`activity-${isZh ? 'zh' : 'en'}`">{{ copy.logs }}</h3>
        <span>{{ copy.submittedHint }}</span>
      </div>
      <p v-if="logs.length === 0" class="empty-log">{{ copy.noLogs }}</p>
      <ol v-else>
        <li v-for="entry in logs" :key="entry.id" :class="`is-${entry.tone}`">
          <time>{{ entry.time }}</time>
          <span>{{ entry.message }}</span>
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped>
.print-demo {
  margin-top: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  padding: 24px;
}

.demo-heading,
.format-head,
.format-actions,
.activity-head,
.connection-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.demo-heading h2,
.format-head h3,
.activity-head h3 {
  margin: 0;
  border: 0;
  padding: 0;
}

.demo-heading p:not(.demo-eyebrow) {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
}

.demo-eyebrow,
.format-head span:first-child {
  margin: 0 0 4px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.connection-state,
.job-status {
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 9px;
}

.connection-state.is-connected,
.job-status.is-completed,
.job-status.is-submitted {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.job-status.is-failed,
.connection-state.is-disconnected {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.device-grid,
.format-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.device-grid {
  margin-top: 24px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 16px;
}

.format-grid {
  margin-top: 20px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
}

label small {
  color: var(--vp-c-text-2);
  font-weight: 400;
}

select,
input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 400;
  padding: 10px 12px;
}

select:focus,
input:focus {
  border-color: var(--vp-c-brand-1);
  outline: 2px solid var(--vp-c-brand-soft);
}

.format-card {
  display: grid;
  gap: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 18px;
}

button {
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: white;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 13px;
}

button.secondary {
  border-color: var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-1);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.demo-error {
  margin: 12px 0 0;
  color: #b91c1c;
  font-size: 13px;
}

.activity {
  margin-top: 20px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 18px;
}

.activity-head {
  align-items: flex-start;
}

.activity-head > span {
  max-width: 440px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  text-align: right;
}

.empty-log {
  margin: 14px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.activity ol {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.activity li {
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 10px;
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.activity time {
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.activity li.is-success span {
  color: #15803d;
}

.activity li.is-error span {
  color: #b91c1c;
}

@media (max-width: 720px) {
  .print-demo {
    padding: 18px;
  }

  .demo-heading,
  .activity-head {
    align-items: stretch;
    flex-direction: column;
  }

  .connection-actions {
    justify-content: flex-start;
  }

  .device-grid,
  .format-grid {
    grid-template-columns: 1fr;
  }

  .activity-head > span {
    text-align: left;
  }
}
</style>
