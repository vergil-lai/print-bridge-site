<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const slides = [
  {
    src: '/screenshots/1.png',
    alt: 'PrintBridge 设置页面截图'
  },
  {
    src: '/screenshots/2.png',
    alt: 'PrintBridge 远程任务页面截图'
  },
  {
    src: '/screenshots/3.png',
    alt: 'PrintBridge 网站白名单页面截图'
  },
  {
    src: '/screenshots/4.png',
    alt: 'PrintBridge IP 白名单页面截图'
  }
]

const current = ref(0)
let timer: ReturnType<typeof window.setInterval> | undefined

const activeSlide = computed(() => slides[current.value])

function goTo(index: number) {
  current.value = index
}

function next() {
  current.value = (current.value + 1) % slides.length
}

function previous() {
  current.value = (current.value + slides.length - 1) % slides.length
}

function start() {
  stop()
  timer = window.setInterval(next, 3800)
}

function stop() {
  if (!timer) return

  window.clearInterval(timer)
  timer = undefined
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section
    class="HeroScreenshotCarousel"
    aria-label="PrintBridge 界面截图"
    @mouseenter="stop"
    @mouseleave="start"
    @focusin="stop"
    @focusout="start"
  >
    <div class="frame">
      <img
        v-for="(slide, index) in slides"
        :key="slide.src"
        class="screenshot"
        :class="{ active: index === current }"
        :src="slide.src"
        :alt="slide.alt"
        draggable="false"
      >

      <button class="nav prev" type="button" aria-label="上一张截图" @click="previous">
        &lt;
      </button>
      <button class="nav next" type="button" aria-label="下一张截图" @click="next">
        &gt;
      </button>
    </div>

    <div class="dots" aria-label="选择截图">
      <button
        v-for="(slide, index) in slides"
        :key="slide.src"
        class="dot"
        type="button"
        :aria-label="`查看${slide.alt}`"
        :aria-current="index === current"
        @click="goTo(index)"
      />
    </div>

    <span class="sr-only" aria-live="polite">{{ activeSlide.alt }}</span>
  </section>
</template>

<style scoped>
.HeroScreenshotCarousel {
  width: 100%;
  height: 100%;
  user-select: none;
}

.frame {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16);
}

.screenshot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 420ms ease;
}

.screenshot.active {
  opacity: 1;
}

.nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  color: #111827;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  opacity: 0;
  transform: translateY(-50%);
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.nav:hover,
.nav:focus-visible {
  background: #fff;
}

.frame:hover .nav,
.nav:focus-visible {
  opacity: 1;
}

.prev {
  left: 12px;
}

.next {
  right: 12px;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--vp-c-divider);
  transition:
    background-color 160ms ease,
    transform 160ms ease,
    width 160ms ease;
}

.dot[aria-current='true'] {
  width: 20px;
  background: var(--vp-c-brand-1);
}

.sr-only {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.dark .frame {
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
}

.dark .nav {
  border-color: rgba(255, 255, 255, 0.16);
  color: #f9fafb;
  background: rgba(17, 24, 39, 0.78);
}

.dark .nav:hover,
.dark .nav:focus-visible {
  background: rgba(17, 24, 39, 0.96);
}

@media (max-width: 639px) {
  .nav {
    opacity: 1;
  }
}
</style>
