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
              <div class="conversation-title-wrap">
                <span class="conversation-title" v-if="editingId !== conv.id">
                  {{ conv.title }}
                </span>
                <input
                  v-else
                  v-model="editingTitle"
                  class="conversation-title-input"
                  @blur="finishEdit(conv)"
                  @keydown.enter="finishEdit(conv)"
                  @click.stop
                  style="width: 80%"
                />
              </div>
              <div class="conversation-actions">
                <a-button
                  type="text"
                  size="small"
                  @click.stop="startEdit(conv)"
                >
                  <template #icon
                    ><i
                      class="anticon anticon-edit"
                      style="font-size: 16px"
                    />✏️</template
                  >
                </a-button>
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
            </div>
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
            v-for="(message, index) in messages.filter(
              (m) => m.role !== 'system'
            )"
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
          <a-select-option value="deepseek-chat">DeepSeek V3</a-select-option>
          <a-select-option value="deepseek-reasoner"
            >DeepSeek R1</a-select-option
          >
        </a-select>
        <a-textarea
          v-model:value="inputMessage"
          placeholder="请输入您的问题..."
          :rows="1"
          :disabled="loading || !currentConversationId"
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
import {
  getChatList,
  getChat,
  deleteChat,
  updateChatTitle,
  createChat,
  ChatDetail,
} from "@/api/chat";

// 对话列表
const conversations = ref<{ id: string; title: string }[]>([]);
// 当前选中的对话ID
const currentConversationId = ref<string | null>(null);
// 当前对话标题
const currentConversationTitle = computed(() => {
  const conv = conversations.value.find(
    (c) => c.id === currentConversationId.value
  );
  return conv ? conv.title : "";
});
// 消息列表
const messages = ref<{ role: string; content: string }[]>([]);
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
// 新增响应式变量
const editingId = ref<string | null>(null);
const editingTitle = ref("");

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

// 加载对话列表
const loadConversations = async () => {
  const res = await getChatList();
  conversations.value = res.data.data || [];
};

// 加载对话详情
const loadChatDetail = async (chatId: string) => {
  const res = await getChat(chatId);
  const detail: ChatDetail = res.data.data;
  currentConversationId.value = detail.id;
  messages.value = (detail.message || []).map((msg) => ({
    role:
      msg.role === "human"
        ? "user"
        : msg.role === "ai"
        ? "assistant"
        : "system",
    content: msg.text,
  }));
  await nextTick();
  scrollToBottom();
};

// 创建新对话
const createNewConversation = async () => {
  const res = await createChat();
  const newId = res.data.data;
  await loadConversations();
  await loadChatDetail(newId);
};

// 删除对话
const deleteConversation = async (conversationId: string) => {
  await deleteChat(conversationId);
  await loadConversations();
  if (conversations.value.length > 0) {
    await loadChatDetail(conversations.value[0].id);
  } else {
    messages.value = [];
    currentConversationId.value = null;
  }
};

// 切换对话
const switchConversation = async (conversationId: string) => {
  if (currentConversationId.value === conversationId) return;
  await loadChatDetail(conversationId);
};

// 修改对话标题（可绑定到UI重命名操作）
const handleUpdateTitle = async (conversationId: string, newTitle: string) => {
  await updateChatTitle(conversationId, newTitle);
  await loadConversations();
};

// 发送消息（流式fetch，保持原有逻辑）
const sendMessage = async () => {
  if (
    !inputMessage.value.trim() ||
    loading.value ||
    !currentConversationId.value
  )
    return;
  // 将用户消息添加到聊天记录
  messages.value.push({
    role: "user",
    content: inputMessage.value,
  });
  loading.value = true;
  // AI消息流式
  const aiMessage = {
    role: "assistant",
    content: "AI正在思考...",
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
        chatId: currentConversationId.value,
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
    // 首次发消息后刷新对话标题
    if (messages.value.length === 2 && currentConversationId.value) {
      await loadConversations();
      await loadChatDetail(currentConversationId.value);
    }
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
// 组件挂载时加载对话列表和首个对话详情
onMounted(async () => {
  await loadConversations();
  if (conversations.value.length > 0) {
    await loadChatDetail(conversations.value[0].id);
  }
});
// 新增方法
const startEdit = (conv: { id: string; title: string }) => {
  editingId.value = conv.id;
  editingTitle.value = conv.title;
  nextTick(() => {
    const input = document.querySelector(
      ".conversation-title-input"
    ) as HTMLInputElement;
    input?.focus();
    input?.select();
  });
};

const finishEdit = async (conv: { id: string; title: string }) => {
  if (editingTitle.value.trim() && editingTitle.value !== conv.title) {
    await handleUpdateTitle(conv.id, editingTitle.value.trim());
  }
  editingId.value = null;
};
</script>

<style scoped>
/* 参考你的样式，略有调整，适配多会话布局 */
.chat-container {
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 80px);
  display: flex;
  gap: 32px;
  background: #f6f8fa;
}
.sidebar {
  width: 270px;
  background: #f9fafb;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 18px 0 18px 0;
}
.sidebar-header {
  padding: 0 20px 18px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: none;
}
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px 0 10px;
}
.conversation-item {
  padding: 16px 14px;
  border-radius: 12px;
  margin-bottom: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s, box-shadow 0.2s;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.conversation-item:hover {
  background-color: #e6f7ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
}
.conversation-item.active {
  background-color: #bae7ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.12);
}
.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0;
  min-height: 36px;
}
.conversation-title-wrap {
  display: flex;
  align-items: center;
  min-height: 36px;
  flex: 1;
  min-width: 0;
}
.conversation-title {
  font-weight: 700;
  font-size: 1.08em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  display: block;
  color: #222;
}
.conversation-title-input {
  font-size: 1em;
  border: 1.5px solid #91d5ff;
  border-radius: 8px;
  padding: 4px 10px;
  margin: 0;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: #f4faff;
  outline: none;
  transition: border 0.2s;
}
.conversation-title-input:focus {
  border: 1.5px solid #1890ff;
  background: #fff;
}
.conversation-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
}
.chat-card {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.1);
  background: #fff;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 10px 24px;
  border-radius: 18px 18px 0 0;
  background: none;
}
.chat-header .title {
  font-weight: bold;
  font-size: 20px;
  color: #222;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px 24px 24px;
  margin-bottom: 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  background: #f8fafc;
}
.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.message-item {
  display: flex;
  margin-bottom: 24px;
}
.message-item.user {
  flex-direction: row-reverse;
}
.avatar {
  margin: 0 18px;
}
.message-content {
  max-width: 85%;
}
.message-text {
  padding: 16px 24px;
  border-radius: 16px;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 1.08em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.user .message-text {
  background-color: #e6f7ff;
  color: #222;
  border-top-right-radius: 0;
}
.assistant .message-text {
  background-color: #f0f0f0;
  color: #222;
  border-top-left-radius: 0;
  width: 1000px;
  min-width: 1000px;
  max-width: 1000px;
  box-sizing: border-box;
}
.chat-input {
  margin-top: auto;
  display: flex;
  align-items: center;
  padding: 24px 24px 24px 24px;
  background: #fff;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
  gap: 18px;
}
:deep(.ant-select-selector) {
  border-radius: 8px !important;
  background: #f4faff !important;
  border: 1.5px solid #91d5ff !important;
  min-height: 48px !important;
  height: 48px !important;
  font-size: 1.08em !important;
  display: flex !important;
  align-items: center !important;
}
:deep(.ant-select-selection-item) {
  line-height: 48px !important;
}
:deep(.ant-select-arrow) {
  color: #1890ff !important;
}
:deep(.ant-input) {
  border-radius: 8px !important;
  background: #f4faff !important;
  border: 1.5px solid #91d5ff !important;
  min-height: 48px !important;
  height: 48px !important;
  max-height: 48px !important;
  font-size: 1.08em !important;
  padding: 8px 14px !important;
  line-height: 32px !important;
  resize: none !important;
  box-shadow: none !important;
  overflow-y: hidden !important;
  /* 隐藏输入框右侧上下箭头 */
  scrollbar-width: none !important;
}
:deep(.ant-input::-webkit-scrollbar) {
  display: none !important;
}
:deep(.ant-input:focus) {
  border: 1.5px solid #1890ff !important;
  background: #fff !important;
  overflow-y: auto !important;
}
.send-button {
  margin-left: 0;
  height: 48px;
  min-width: 100px;
  border-radius: 24px;
  font-size: 1.12em;
  font-weight: 600;
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  border: none;
  transition: background 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send-button:disabled {
  background: #d6e4ff;
  color: #888;
  box-shadow: none;
}
.send-button:hover:not(:disabled) {
  background: linear-gradient(90deg, #40a9ff 0%, #1890ff 100%);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.18);
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
  padding: 0;
  overflow: hidden;
  background: none;
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
