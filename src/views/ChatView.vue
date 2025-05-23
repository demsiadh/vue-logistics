<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <a-button type="primary" block @click="createNewConversation">
          新对话
        </a-button>
      </div>
      <div class="conversations-list">
        <a-empty v-if="conversations.length === 0" description="暂无对话" />
        <div v-else>
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: currentConversationId === conv.id }"
            @click="switchConversation(conv.id)"
          >
            <div class="conversation-header">
              <span class="conversation-title">{{ conv.title }}</span>
              <a-popconfirm
                title="确定要删除此对话吗?"
                @confirm="deleteConversation(conv.id)"
                ok-text="是"
                cancel-text="否"
              >
                <a-button type="text" danger size="small">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-popconfirm>
            </div>
            <span class="conversation-time">{{
              formatDate(conv.updatedAt)
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 主聊天区 -->
    <a-card class="chat-card" :bordered="false">
      <template #title>
        <div class="chat-header">
          <span class="title">{{
            currentConversationTitle || "智能客服助手"
          }}</span>
          <div class="header-actions">
            <a-badge
              :status="connectionStatus.color"
              :text="connectionStatus.text"
            />
          </div>
        </div>
      </template>
      <div class="chat-content" ref="chatContentRef">
        <div v-if="messages.length === 0 && !loading" class="empty-chat">
          <a-empty description="暂无消息，开始聊天吧" />
        </div>
        <!-- 消息流始终渲染 -->
        <template v-else>
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <div class="avatar">
              <a-avatar
                :style="{
                  backgroundColor:
                    message.role === 'user' ? '#1890ff' : '#52c41a',
                }"
              >
                <template #icon>
                  <UserOutlined v-if="message.role === 'user'" />
                  <RobotOutlined v-else />
                </template>
              </a-avatar>
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
              <div class="message-time">
                {{ formatDate(message.timestamp) }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="chat-input">
        <a-select
          v-model:value="selectedModel"
          style="width: 180px; margin-right: 16px"
          placeholder="选择模型"
          :dropdownAlign="{ points: ['bl', 'tl'], offset: [0, 4] }"
        >
          <a-select-option value="hunyuan-lite">Hunyuan Lite</a-select-option>
          <a-select-option value="hunyuan-turbos-latest"
            >Hunyuan Turbos</a-select-option
          >
          <a-select-option value="deepseek-reasoner">DeepSeek</a-select-option>
        </a-select>
        <a-textarea
          v-model:value="inputMessage"
          placeholder="请输入您的问题..."
          :rows="3"
          :disabled="loading || !currentConversationId"
          @keydown.enter="handleEnterPress"
        />
        <a-button
          type="primary"
          :disabled="!inputMessage.trim() || loading || !currentConversationId"
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
import { ref, reactive, onMounted, nextTick, watch, computed } from "vue";
import { message as antdMessage } from "ant-design-vue";
import {
  DeleteOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons-vue";
import { marked } from "marked";

// 消息和会话接口
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  conversationId: string;
}
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// 聊天消息列表
const messages = ref<ChatMessage[]>([]);
// 对话列表
const conversations = ref<Conversation[]>([]);
// 当前选中的对话ID
const currentConversationId = ref<string | null>(null);
// 当前对话标题
const currentConversationTitle = computed(() => {
  const conversation = conversations.value.find(
    (c) => c.id === currentConversationId.value
  );
  return conversation ? conversation.title : "";
});
// 输入消息
const inputMessage = ref("");
// 选择的模型
const selectedModel = ref("hunyuan-lite");
// 加载状态
const loading = ref(false);
// 聊天区域引用
const chatContentRef = ref<HTMLDivElement | null>(null);
// 连接状态
const connectionStatus = reactive({
  color: "success" as "success" | "error" | "default",
  text: "正常",
});

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
// 渲染markdown内容
const renderMarkdown = (content: string) => {
  try {
    // 去除首尾多余空行
    let cleanContent = content.replace(/^\s+|\s+$/g, "");
    // 合并连续3个及以上换行为2个
    cleanContent = cleanContent.replace(/\n{3,}/g, "\n\n");
    return marked(cleanContent);
  } catch (e) {
    return content;
  }
};
// 创建新对话
const createNewConversation = () => {
  const now = Date.now();
  const newConversation: Conversation = {
    id: `conv_${now}`,
    title: `新对话 ${new Date(now).toLocaleString("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`,
    createdAt: now,
    updatedAt: now,
  };
  conversations.value.unshift(newConversation);
  switchConversation(newConversation.id);
};
// 删除对话
const deleteConversation = (conversationId: string) => {
  conversations.value = conversations.value.filter(
    (c) => c.id !== conversationId
  );
  // 如果删除的是当前会话，切换到第一个会话或创建新会话
  if (currentConversationId.value === conversationId) {
    if (conversations.value.length > 0) {
      switchConversation(conversations.value[0].id);
    } else {
      currentConversationId.value = null;
      messages.value = [];
      createNewConversation();
    }
  }
};
// 切换对话
const switchConversation = (conversationId: string) => {
  if (currentConversationId.value === conversationId) return;
  currentConversationId.value = conversationId;
  messages.value = [];
};
// 更新对话的最后修改时间
const updateConversationTime = (conversationId: string) => {
  const conversation = conversations.value.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.updatedAt = Date.now();
  }
};
// 处理回车按键
const handleEnterPress = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};
// 发送消息（流式fetch）
const sendMessage = async () => {
  if (
    !inputMessage.value.trim() ||
    loading.value ||
    !currentConversationId.value
  )
    return;
  // 将用户消息添加到聊天记录
  const userMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: "user",
    content: inputMessage.value,
    timestamp: Date.now(),
    conversationId: currentConversationId.value,
  };
  messages.value.push(userMessage);
  updateConversationTime(currentConversationId.value);
  loading.value = true;
  // AI消息流式
  const aiMessage: ChatMessage = {
    id: `msg_${Date.now()}_ai`,
    role: "assistant",
    content: "AI正在思考...",
    timestamp: Date.now(),
    conversationId: currentConversationId.value,
  };
  messages.value.push(aiMessage);
  let aiMsg = "";
  scrollToBottom();
  try {
    const response = await fetch("http://localhost:8080/api/llm/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        logistics_token: localStorage.getItem("logistics_token") || "",
      },
      body: JSON.stringify({
        model: selectedModel.value,
        message: inputMessage.value,
      }),
    });
    if (!response.body) throw new Error("无流式响应体");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        aiMsg += chunk;
        // 第一段内容到达时替换"AI正在思考..."
        aiMessage.content = aiMsg || "AI正在思考...";
        messages.value = [...messages.value];
        await nextTick();
        scrollToBottom();
      }
    }
    aiMessage.content = aiMsg || "AI正在思考...";
    scrollToBottom();
  } catch (err: any) {
    antdMessage.error("请求失败：" + (err?.message || err));
  } finally {
    loading.value = false;
    inputMessage.value = "";
    scrollToBottom();
  }
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
// 组件挂载时加载对话列表
onMounted(() => {
  if (conversations.value.length === 0) {
    createNewConversation();
  } else {
    switchConversation(conversations.value[0].id);
  }
});
</script>

<style scoped>
/* 参考你的样式，略有调整，适配多会话布局 */
.chat-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 80px);
  display: flex;
  gap: 24px;
}
.sidebar {
  width: 250px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.conversation-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s;
}
.conversation-item:hover {
  background-color: #f5f5f5;
}
.conversation-item.active {
  background-color: #e6f7ff;
}
.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.conversation-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.chat-card {
  flex: 1;
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
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 8px;
  margin-bottom: 16px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  position: relative; /* 让 loading-indicator-floating 绝对定位于此 */
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
.loading-indicator-floating {
  position: absolute;
  left: 0;
  right: 0;
  top: 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none;
  background: none;
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
.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol),
.markdown-content :deep(li),
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 2px !important;
  margin-bottom: 2px !important;
  padding: 0 !important;
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 18px !important;
  padding-left: 0 !important;
}
.markdown-content :deep(li) {
  margin-left: 0 !important;
  padding-left: 0 !important;
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
