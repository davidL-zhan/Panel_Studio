<!-- DDD §06-page-layout.md §1 — 话题输入框 -->
<script setup lang="ts">
import { computed } from 'vue'
import { DISCUSSION } from '@/constants/design-tokens'

const model = defineModel<string>({ required: true })

const charCount = computed(() => model.value.length)
const isOverLimit = computed(() => charCount.value > DISCUSSION.maxTopicLength)
</script>

<template>
  <div class="topic-input-wrap">
    <label for="topic-input" class="sr-only">讨论话题</label>
    <input
      id="topic-input"
      type="text"
      class="topic-input"
      :class="{ error: isOverLimit }"
      placeholder="输入讨论话题..."
      maxlength="220"
      v-model="model"
      autocomplete="off"
    />
    <span class="char-count" :class="{ over: isOverLimit }">
      {{ charCount }} / {{ DISCUSSION.maxTopicLength }}
    </span>
  </div>
</template>

<style scoped>
.topic-input-wrap {
  position: relative;
  flex: 1;
}
.topic-input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-md);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: border-color var(--duration-fast) var(--ease-out);
}
.topic-input::placeholder { color: var(--text-tertiary); }
.topic-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(78, 78, 138, 0.2);
  outline: none;
}
.topic-input.error { border-color: var(--color-error); }

.char-count {
  position: absolute;
  right: var(--space-sm);
  bottom: -20px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.char-count.over { color: var(--color-error); }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
