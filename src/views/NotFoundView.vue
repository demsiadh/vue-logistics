<template>
  <div class="not-found-container">
    <h1>404 页面未找到</h1>
    <p>你访问的页面尚未开发或路径错误</p>
    <a-button type="primary" @click="goBackHome">返回首页</a-button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ROUTER_CONFIG } from "@/config/router";

const router = useRouter();

const goBackHome = () => {
  router.push({
    path: ROUTER_CONFIG.HOME.PATH,
  });
};
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  font-family: "Arial", sans-serif;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
}

p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 30px;
}
</style>
