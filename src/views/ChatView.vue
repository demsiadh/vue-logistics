<template>
  <div class="chat-container">
    <a-card class="chat-card" :bordered="false">
      <template #title>
        <div class="chat-header">
          <span class="title">智能客服助手</span>
          <a-badge
            :status="connectionStatus.color"
            :text="connectionStatus.text"
          />
        </div>
      </template>
      <div class="chat-content" ref="chatContentRef">
        <div v-if="messages.length === 0" class="empty-chat">
          <a-empty description="暂无消息，开始聊天吧" />
        </div>
        <template v-else>
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <div class="avatar">
              <a-avatar
                :icon="message.role === 'user' ? 'user' : 'robot'"
                :style="{
                  backgroundColor:
                    message.role === 'user' ? '#1890ff' : '#52c41a',
                }"
              />
            </div>
            <div class="message-content">
              <div class="message-text" v-if="message.role === 'user'">
                {{ message.content }}
              </div>
              <div
                class="message-text markdown-content"
                v-else
                v-html="renderMarkdown(message.content)"
              ></div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
        </template>
        <div v-if="isLoading" class="loading-indicator">
          <a-spin /> <span class="loading-text">AI正在思考...</span>
        </div>
      </div>
      <div class="chat-input">
        <a-select
          v-model:value="selectedModel"
          style="width: 120px; margin-right: 16px"
          placeholder="选择模型"
        >
          <a-select-option value="hunyuan-lite">Hunyuan Lite</a-select-option>
          <a-select-option value="default">Default</a-select-option>
        </a-select>
        <a-textarea
          v-model:value="inputMessage"
          placeholder="请输入您的问题..."
          :rows="3"
          :disabled="isLoading"
          @keydown.enter="handleEnterPress"
        />
        <a-button
          type="primary"
          :disabled="!inputMessage.trim() || isLoading"
          @click="sendMessage"
          class="send-button"
        >
          发送
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from "vue";
import { message } from "ant-design-vue";
import { UserOutlined, RobotOutlined } from "@ant-design/icons-vue";
import { marked } from "marked";

// 定义消息接口
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

// 聊天消息列表
const messages = ref<ChatMessage[]>([]);

// 输入消息
const inputMessage = ref("");

// 选择的模型
const selectedModel = ref("hunyuan-lite");

// WebSocket 连接
let websocket: WebSocket | null = null;

// 加载状态
const isLoading = ref(false);

// 聊天区域引用，用于自动滚动
const chatContentRef = ref<HTMLDivElement | null>(null);

// 连接状态
const connectionStatus = reactive({
  color: "default" as "success" | "error" | "default",
  text: "未连接",
});

// 跟踪当前正在接收的消息ID
let currentMessageId = -1;

// 渲染markdown内容
const renderMarkdown = (content: string) => {
  try {
    return marked(content);
  } catch (e) {
    console.error("Markdown解析错误:", e);
    return content;
  }
};

// 初始化WebSocket连接
const initWebSocket = () => {
  try {
    connectionStatus.color = "default";
    connectionStatus.text = "连接中...";

    // 获取认证令牌，使用与API请求相同的方式
    const token = localStorage.getItem("logistics_token") || "";

    // 在URL中添加令牌作为查询参数
    const wsUrl = `ws://localhost:8080/api/llm/chat?logistics_token=${token}`;
    websocket = new WebSocket(wsUrl);

    // 连接建立时触发
    websocket.onopen = () => {
      connectionStatus.color = "success";
      connectionStatus.text = "已连接";
    };

    // 接收到消息时触发
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 如果是第一条消息，创建新的消息项
        if (currentMessageId === -1) {
          // 添加新的助手消息
          messages.value.push({
            role: "assistant",
            content: data.content || "",
            time: getFormattedTime(),
          });
          // 记录当前消息的索引
          currentMessageId = messages.value.length - 1;
          // 滚动到底部
          scrollToBottom();
        } else {
          // 更新已有消息的内容
          if (
            currentMessageId >= 0 &&
            currentMessageId < messages.value.length
          ) {
            messages.value[currentMessageId].content += data.content || "";
            // 滚动到底部
            scrollToBottom();
          }
        }

        // 如果是最后一条消息，重置状态
        if (data.done) {
          // 重置当前消息ID和加载状态
          currentMessageId = -1;
          isLoading.value = false;

          // 清空输入框内容
          inputMessage.value = "";
        }
      } catch (error) {
        console.error("解析消息失败:", error);
      }
    };

    // 连接关闭时触发
    websocket.onclose = () => {
      connectionStatus.color = "error";
      connectionStatus.text = "已断开";

      // 如果正在加载中被断开，重置状态
      if (isLoading.value) {
        isLoading.value = false;

        // 如果当前正在接收消息，在消息后添加断开提示
        if (
          currentMessageId !== -1 &&
          currentMessageId < messages.value.length
        ) {
          messages.value[currentMessageId].content += " [连接已断开]";
          currentMessageId = -1;
          scrollToBottom();
        }
      }

      // 尝试重新连接
      setTimeout(initWebSocket, 3000);
    };

    // 发生错误时触发
    websocket.onerror = (error) => {
      connectionStatus.color = "error";
      connectionStatus.text = "连接错误";
      console.error("WebSocket连接错误:", error);
    };
  } catch (error) {
    connectionStatus.color = "error";
    connectionStatus.text = "连接失败";
    console.error("初始化WebSocket失败:", error);
  }
};

// 处理回车按键
const handleEnterPress = (e: KeyboardEvent) => {
  e.preventDefault();
  sendMessage();
};

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    // 不显示错误消息，而是尝试重新连接
    initWebSocket();
    return;
  }

  // 将用户消息添加到聊天记录
  messages.value.push({
    role: "user",
    content: inputMessage.value,
    time: getFormattedTime(),
  });

  // 设置加载状态
  isLoading.value = true;

  // 发送消息
  try {
    websocket.send(
      JSON.stringify({
        message: inputMessage.value,
        model: selectedModel.value,
      })
    );

    // 清空输入框
    inputMessage.value = "";

    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    isLoading.value = false;
    // 不显示错误消息
    console.error("发送消息失败:", error);
  }
};

// 获取格式化的时间
const getFormattedTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContentRef.value) {
      chatContentRef.value.scrollTop = chatContentRef.value.scrollHeight;
    }
  });
};

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom();
});

// 组件挂载时初始化WebSocket
onMounted(() => {
  initWebSocket();

  // 添加欢迎消息
  messages.value.push({
    role: "assistant",
    content: "您好！我是您的智能客服助手，有什么可以帮您解决的问题吗？",
    time: getFormattedTime(),
  });
});

// 组件卸载时关闭WebSocket连接
onUnmounted(() => {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
});
</script>

<style scoped>
.chat-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 80px);
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header .title {
  font-weight: bold;
  font-size: 16px;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 8px;
  margin-bottom: 16px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 12px;
}

.message-content {
  max-width: 85%;
}

.message-text {
  padding: 10px 16px;
  border-radius: 8px;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}

.user .message-text {
  background-color: #e6f7ff;
  color: #000;
  border-top-right-radius: 0;
}

.assistant .message-text {
  background-color: #f0f0f0;
  color: #000;
  border-top-left-radius: 0;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.user .message-time {
  text-align: right;
}

.assistant .message-time {
  text-align: left;
}

.chat-input {
  margin-top: auto;
  display: flex;
  align-items: flex-start;
}

.send-button {
  margin-left: 16px;
  height: 80px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  margin-bottom: 16px;
}

.loading-text {
  margin-left: 10px;
  color: #888;
}

:deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

/* Markdown styling */
.markdown-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(p) {
  margin-bottom: 8px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(pre) {
  background-color: rgb(45, 45, 45);
  color: #fff;
  padding: 12px 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
  display: block;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  margin-left: 0;
  color: #666;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 24px;
}

.markdown-content :deep(img) {
  max-width: 100%;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px;
}

.markdown-content :deep(table th) {
  background-color: #f5f5f5;
  font-weight: 600;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 16px 0;
}
</style>
