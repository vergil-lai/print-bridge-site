<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import HeroScreenshotCarousel from './components/HeroScreenshotCarousel.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template v-if="frontmatter.heroCarousel" #home-hero-image>
      <HeroScreenshotCarousel />
    </template>
  </Layout>
</template>
