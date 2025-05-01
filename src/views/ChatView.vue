<template>
  <div class="chat-container">
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
                  <template #icon><delete-outlined /></template>
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
              <div class="message-time">
                {{ formatDate(message.timestamp) }}
              </div>
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
          :disabled="isLoading || !currentConversationId"
          @keydown.enter="handleEnterPress"
        />
        <a-button
          type="primary"
          :disabled="
            !inputMessage.trim() || isLoading || !currentConversationId
          "
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
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  computed,
} from "vue";
import { message } from "ant-design-vue";
import {
  UserOutlined,
  RobotOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import { marked } from "marked";

// 定义消息接口
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  conversationId: string;
}

// 定义对话接口
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// 本地存储键
const STORAGE_KEYS = {
  CONVERSATIONS: "chat_conversations",
  MESSAGES: "chat_messages",
};

const MESSAGE_RETENTION_DAYS = 7;

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
    return marked(content);
  } catch (e) {
    console.error("Markdown解析错误:", e);
    return content;
  }
};

// 加载对话列表
const loadConversations = () => {
  try {
    const storedConversations = localStorage.getItem(
      STORAGE_KEYS.CONVERSATIONS
    );
    if (storedConversations) {
      conversations.value = JSON.parse(storedConversations).sort(
        (a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt
      );
    }
  } catch (error) {
    console.error("加载对话列表失败:", error);
  }
};

// 保存对话列表
const saveConversations = () => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS,
      JSON.stringify(conversations.value)
    );
  } catch (error) {
    console.error("保存对话列表失败:", error);
  }
};

// 加载消息
const loadMessages = (conversationId: string) => {
  try {
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!storedMessages) {
      messages.value = [];
      return;
    }

    const allMessages: ChatMessage[] = JSON.parse(storedMessages);
    const now = Date.now();
    const retentionPeriod = MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000; // 7天的毫秒数

    // 过滤出当前会话的消息，并且不超过7天
    messages.value = allMessages.filter(
      (msg) =>
        msg.conversationId === conversationId &&
        now - msg.timestamp <= retentionPeriod
    );

    // 删除过期消息
    const validMessages = allMessages.filter(
      (msg) => now - msg.timestamp <= retentionPeriod
    );
    if (validMessages.length !== allMessages.length) {
      localStorage.setItem(
        STORAGE_KEYS.MESSAGES,
        JSON.stringify(validMessages)
      );
    }

    scrollToBottom();
  } catch (error) {
    console.error("加载消息失败:", error);
    message.error("加载聊天记录失败");
  }
};

// 保存消息
const saveMessages = () => {
  try {
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    let allMessages: ChatMessage[] = storedMessages
      ? JSON.parse(storedMessages)
      : [];

    // 获取当前会话的所有消息的ID
    const currentMessageIds = messages.value.map((msg) => msg.id);

    // 删除本地存储中当前会话的旧消息
    allMessages = allMessages.filter(
      (msg) => !currentMessageIds.includes(msg.id)
    );

    // 添加当前会话的最新消息
    allMessages = [...allMessages, ...messages.value];

    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  } catch (error) {
    console.error("保存消息失败:", error);
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
  saveConversations();
  switchConversation(newConversation.id);
};

// 删除对话
const deleteConversation = (conversationId: string) => {
  // 从内存中删除会话
  conversations.value = conversations.value.filter(
    (c) => c.id !== conversationId
  );
  saveConversations();

  // 删除该会话的所有消息
  const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  if (storedMessages) {
    const allMessages: ChatMessage[] = JSON.parse(storedMessages);
    const filteredMessages = allMessages.filter(
      (msg) => msg.conversationId !== conversationId
    );
    localStorage.setItem(
      STORAGE_KEYS.MESSAGES,
      JSON.stringify(filteredMessages)
    );
  }

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
  loadMessages(conversationId);

  // 如果WebSocket已连接，重新连接以包含新的会话ID
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.close();
    websocket = null;
    initWebSocket();
  }
};

// 更新对话的最后修改时间
const updateConversationTime = (conversationId: string) => {
  const conversation = conversations.value.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.updatedAt = Date.now();
    saveConversations();
  }
};

// 初始化WebSocket连接
const initWebSocket = () => {
  try {
    connectionStatus.color = "default";
    connectionStatus.text = "连接中...";

    // 获取认证令牌
    const token = localStorage.getItem("logistics_token") || "";

    // 在URL中添加令牌作为查询参数
    const wsUrl = `ws://150.158.84.167:8080/api/llm/chat`;
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
        if (currentMessageId === -1 && currentConversationId.value) {
          // 添加新的助手消息
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: data.content || "",
            timestamp: Date.now(),
            conversationId: currentConversationId.value,
          };

          messages.value.push(assistantMessage);

          // 记录当前消息的索引
          currentMessageId = messages.value.length - 1;

          // 更新对话的最后修改时间
          updateConversationTime(currentConversationId.value);

          // 保存消息
          saveMessages();

          // 滚动到底部
          scrollToBottom();
        } else if (currentConversationId.value && currentMessageId !== -1) {
          // 更新已有消息的内容
          if (
            currentMessageId >= 0 &&
            currentMessageId < messages.value.length
          ) {
            messages.value[currentMessageId].content += data.content || "";

            // 保存消息
            saveMessages();

            // 滚动到底部
            scrollToBottom();
          }
        }

        // 如果是最后一条消息，重置状态
        if (data.done) {
          // 保存最终的消息内容
          saveMessages();

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

          // 保存消息
          if (currentConversationId.value) {
            saveMessages();
          }

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
  if (
    !inputMessage.value.trim() ||
    isLoading.value ||
    !currentConversationId.value
  )
    return;

  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    // 尝试重新连接
    initWebSocket();
    return;
  }

  // 将用户消息添加到聊天记录
  const userMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: "user",
    content: inputMessage.value,
    timestamp: Date.now(),
    conversationId: currentConversationId.value,
  };

  messages.value.push(userMessage);

  // 更新对话的最后修改时间
  updateConversationTime(currentConversationId.value);

  // 保存消息
  saveMessages();

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
    console.error("发送消息失败:", error);
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

// 组件挂载时加载对话列表和初始化WebSocket
onMounted(() => {
  // 加载对话列表
  loadConversations();

  // 如果没有对话，创建一个新对话
  if (conversations.value.length === 0) {
    createNewConversation();
  } else {
    // 选择最新的对话
    switchConversation(conversations.value[0].id);
  }

  // 初始化WebSocket
  initWebSocket();
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
