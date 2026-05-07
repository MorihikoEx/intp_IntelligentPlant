<template>
  <div>
    <span
        :class="isConnected ? 'tag-correct fill shadow' : 'tag-disabled fill'"
        class="mc-status-badge"
    >
      <i
          v-if="isConnected"
          aria-hidden="true"
          class="bi bi-check-circle status-icon"
      ></i>
      <i
          v-else
          aria-hidden="true"
          class="bi bi-cloud-slash status-icon"
      ></i>
      {{ isConnected ? '已连接' : '连接关闭' }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  isConnected: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.status-icon {
  margin-right: 6px;
}
</style>
