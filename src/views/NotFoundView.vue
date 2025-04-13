<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">
        <h1>页面未找到</h1>
        <p>抱歉，您访问的页面不存在或已被移除</p>
      </div>
      <div class="action-buttons">
        <a-button type="primary" size="large" @click="goBackHome">
          <template #icon><home-outlined /></template>
          返回首页
        </a-button>
        <a-button size="large" @click="goBack">
          <template #icon><rollback-outlined /></template>
          返回上一页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ROUTER_CONFIG } from "@/config/constants";
import { HomeOutlined, RollbackOutlined } from "@ant-design/icons-vue";

const router = useRouter();

const goBackHome = () => {
  router.push({
    path: ROUTER_CONFIG.HOME.PATH,
  });
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-message {
  margin-bottom: 40px;
}

.error-message h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 16px;
}

.error-message p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-buttons :deep(.ant-btn) {
  height: 40px;
  padding: 0 24px;
  font-size: 16px;
  border-radius: 8px;
}

.action-buttons :deep(.ant-btn-primary) {
  background: #1890ff;
  border-color: #1890ff;
}

.action-buttons :deep(.ant-btn-primary:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
}

@media (max-width: 480px) {
  .not-found-content {
    padding: 20px;
  }

  .error-code {
    font-size: 80px;
  }

  .error-message h1 {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
