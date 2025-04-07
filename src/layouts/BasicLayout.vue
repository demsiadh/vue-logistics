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
          领运物流 by demsiadh
        </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
import { loginUser } from "@/api/user";
loginUser({
  name: "lisi",
  password: "lisi",
}).then((res) => {
  console.log(res);
});
</script>

<style>
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
  margin-top: 10px;
  margin-bottom: 30px;
  background: #f5f5f5;
}
#basic .header {
  background: #fff;
  padding-inline: 20px;
}
</style>
