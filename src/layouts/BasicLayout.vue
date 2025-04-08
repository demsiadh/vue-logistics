<template>
  <div id="basic">
    <a-layout>
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <a href="https://github.com/demsiadh" target="_blank">
          {{ PROJECT_NAME }} by demsiadh
        </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
import { PROJECT_NAME } from "@/config/project";
</script>

<style>
#basic {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#basic .footer {
  text-align: center;
  background: #ffff;
  position: fixed;
  height: 30px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px;
}

#basic .content {
  padding-top: 70px;
  margin-bottom: 30px;
  background: #f5f5f5;
  flex: 1;
}

#basic .header {
  background: #ffff;
  padding-inline: 20px;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}
</style>
