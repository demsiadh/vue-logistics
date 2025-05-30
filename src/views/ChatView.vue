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
            :class="[
              message.role,
              { 'is-generic': message.role === 'generic' },
            ]"
          >
            <div class="avatar">
              <a-avatar
                :style="{
                  backgroundColor:
                    message.role === 'assistant' ? '#52c41a' : '#1890ff',
                }"
              >
                <template #icon>
                  <RobotOutlined v-if="message.role === 'assistant'" />
                  <UserOutlined v-else />
                </template>
              </a-avatar>
            </div>
            <div class="message-content">
              <div
                v-if="message.role === 'generic'"
                class="message-text"
                :class="{ 'has-content': showGenericMap[index] }"
              >
                <div
                  class="generic-trigger"
                  @click="showGenericMap[index] = !showGenericMap[index]"
                >
                  <InfoCircleOutlined style="margin-right: 6px" />
                  <span>
                    {{
                      showGenericMap[index]
                        ? "收起相关知识"
                        : "点击查看相关知识"
                    }}
                  </span>
                </div>
                <div
                  v-show="showGenericMap[index]"
                  class="generic-content markdown-content"
                  v-html="renderMarkdown(message.text)"
                ></div>
              </div>
              <div v-else-if="message.role === 'user'" class="message-text">
                {{ message.text }}
              </div>
              <div
                v-else
                class="message-text markdown-content"
                v-html="renderMarkdown(message.text)"
              ></div>
            </div>
          </div>
        </template>
      </div>
      <div class="chat-input">
        <div class="chat-options">
          <div class="left-options">
            <a-select
              v-model:value="selectedModel"
              style="width: 160px"
              placeholder="选择模型"
              size="middle"
            >
              <a-select-option value="hunyuan-lite">
                Hunyuan Lite
              </a-select-option>
              <a-select-option value="hunyuan-turbos-latest">
                Hunyuan Turbos
              </a-select-option>
              <a-select-option value="deepseek-chat">
                DeepSeek V3
              </a-select-option>
              <a-select-option value="deepseek-reasoner">
                DeepSeek R1
              </a-select-option>
            </a-select>
            <a-button
              :type="isRagEnabled ? 'primary' : 'default'"
              @click="isRagEnabled = !isRagEnabled"
              class="rag-button"
              size="middle"
            >
              检索增强
            </a-button>
            <a-button
              :type="isAgent ? 'primary' : 'default'"
              @click="isAgent = !isAgent"
              class="agent-button"
              size="middle"
            >
              Agent
            </a-button>
            <a-button
              :type="showRepository ? 'primary' : 'default'"
              @click="showRepository = !showRepository"
              class="repository-button"
              size="middle"
            >
              知识库管理
            </a-button>
          </div>
        </div>
        <div class="input-area">
          <a-textarea
            v-model:value="inputMessage"
            placeholder="请输入您的问题..."
            :rows="1"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            :disabled="loading || !currentConversationId"
            class="chat-textarea"
            :class="{ 'is-disabled': loading || !currentConversationId }"
            @keydown.enter.prevent
            @keyup.enter="
              !loading &&
                currentConversationId &&
                inputMessage.trim() &&
                sendMessage()
            "
          />
          <a-button
            type="primary"
            :disabled="
              !inputMessage.trim() || loading || !currentConversationId
            "
            @click="sendMessage"
            class="send-button"
            size="large"
          >
            发送
          </a-button>
        </div>
      </div>
    </a-card>
    <a-drawer
      title="知识库管理"
      placement="right"
      :visible="showRepository"
      @close="showRepository = false"
      :width="400"
    >
      <div class="repository-header">
        <div class="repository-search">
          <a-input-search
            v-model:value="searchFileName"
            placeholder="搜索文件名"
            @search="handleSearch"
            style="width: 200px"
          />
          <Upload
            :customRequest="handleFileUpload"
            :showUploadList="false"
            :maxCount="1"
            accept=".txt,.md,.json,.yaml,.yml"
          >
            <a-button type="primary" :loading="fileLoading">
              <upload-outlined />
              上传文件
            </a-button>
          </Upload>
        </div>
      </div>
      <a-spin :spinning="fileLoading">
        <div class="repository-list">
          <a-empty v-if="fileList.length === 0" description="暂无文件" />
          <a-list v-else :data-source="fileList">
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="file-item">
                  <div class="file-info">
                    <file-outlined />
                    <span class="file-name">{{ item.fileName }}</span>
                  </div>
                  <div class="file-actions">
                    <a-button
                      type="link"
                      size="small"
                      @click="handleFileDownload(item.id)"
                    >
                      下载
                    </a-button>
                    <a-popconfirm
                      title="确定要删除此文件吗?"
                      @confirm="handleFileDelete(item.id)"
                      ok-text="是"
                      cancel-text="否"
                    >
                      <a-button type="link" danger size="small">
                        删除
                      </a-button>
                    </a-popconfirm>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from "vue";
import { message as antdMessage, Upload } from "ant-design-vue";
import {
  DeleteOutlined,
  UserOutlined,
  RobotOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  FileOutlined,
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
import {
  uploadFile,
  deleteFile,
  getFileList,
  downloadFileFromBase64,
  BusinessType,
  FileInfo,
} from "@/api/file";

// 在script部分添加类型定义
interface Message {
  role: string;
  text: string;
}

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
const messages = ref<Message[]>([]);
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
// 新增isRagEnabled变量
const isRagEnabled = ref(false);
// 新增showGenericMap变量
const showGenericMap = ref<{ [key: string]: boolean }>({});
// 新增showRepository变量
const showRepository = ref(false);
// 新增fileList变量
const fileList = ref<FileInfo[]>([]);
// 新增fileLoading变量
const fileLoading = ref(false);
// 新增searchFileName变量
const searchFileName = ref("");
// 新增isAgent变量
const isAgent = ref(false);

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
        : msg.role,
    text: msg.text,
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
  messages.value.push({
    role: "user",
    text: inputMessage.value,
  });
  loading.value = true;
  const aiMessage = {
    role: "assistant",
    text: "AI正在思考...",
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
        isRag: isRagEnabled.value,
        isAgent: isAgent.value,
      }),
    });
    if (!response.body) throw new Error();
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        aiMsg += chunk;
        aiMessage.text = aiMsg || "AI正在思考...";
        messages.value = [...messages.value];
        await nextTick();
        scrollToBottom();
      }
    }
    aiMessage.text = aiMsg || "AI正在思考...";
    scrollToBottom();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
    inputMessage.value = "";
    scrollToBottom();
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

// 获取知识库文件列表
const loadFileList = async () => {
  try {
    fileLoading.value = true;
    const res = await getFileList({
      fileType: BusinessType.AIRepository,
      fileName: searchFileName.value || "",
      skip: 0,
      limit: 10,
    });
    fileList.value = res.data.data || [];
  } catch (error) {
    fileList.value = [];
  } finally {
    fileLoading.value = false;
  }
};

// 添加搜索处理函数
const handleSearch = () => {
  loadFileList();
};

// 处理文件上传
const handleFileUpload = async (options: any) => {
  const { file, onSuccess, onError } = options;
  try {
    fileLoading.value = true;
    const res = await uploadFile(file, BusinessType.AIRepository);
    if (res.data.code === 0) {
      await loadFileList();
      onSuccess?.(res);
    } else {
      throw new Error(res.data.message);
    }
  } catch (error) {
    console.error("文件上传错误:", error);
    onError?.(error);
  } finally {
    fileLoading.value = false;
  }
};

// 处理文件删除
const handleFileDelete = async (fileId: string) => {
  try {
    await deleteFile(fileId);
    await loadFileList();
  } catch (error) {
    console.error("文件删除错误:", error);
  }
};

// 处理文件下载
const handleFileDownload = async (fileId: string) => {
  try {
    const fileInfo = fileList.value.find((file) => file.id === fileId);
    if (!fileInfo || !fileInfo.fileData) {
      throw new Error();
    }
    await downloadFileFromBase64(
      fileInfo.fileData,
      fileInfo.fileName,
      fileInfo.contentType
    );
  } catch (error) {
    console.error("文件下载错误:", error);
  }
};

// 修改 showRepository 的 watch 处理
watch(showRepository, (newVal) => {
  if (newVal) {
    loadFileList();
  }
});
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
  padding: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}
.chat-input {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  padding: 12px 24px 16px;
  background: #fff;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
  border-top: 1px solid #f0f0f0;
}
.chat-options {
  margin-bottom: 12px;
}
.left-options {
  display: flex;
  align-items: center;
}
/* 统一按钮和选择框间隔，提升优先级，兼容AntD结构 */
.left-options :deep(> *) {
  margin-right: 8px !important;
}
.left-options :deep(> *:last-child) {
  margin-right: 0 !important;
}
/* 基础按钮样式 */
.rag-button,
.agent-button,
.repository-button {
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
}

.rag-button:hover,
.agent-button:hover,
.repository-button:hover {
  opacity: 0.85;
}

:deep(.ant-select-selector) {
  border-radius: 4px !important;
  height: 32px !important;
  border-color: #d9d9d9 !important;
}

:deep(.ant-select-selection-item) {
  line-height: 30px !important;
  font-size: 14px;
}

.input-area {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.chat-textarea {
  flex: 1;
  border-radius: 6px !important;
  resize: none !important;
  transition: all 0.3s !important;
  font-size: 14px !important;
  padding: 8px 12px !important;
  min-height: 40px !important;
  max-height: 120px !important;
  background: #fff !important;
  border: 1px solid #d9d9d9 !important;
  overflow-y: auto !important;
}
.chat-textarea:hover {
  border-color: #40a9ff !important;
}
.chat-textarea:focus {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}
.chat-textarea.is-disabled {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  cursor: not-allowed;
}
.send-button {
  margin-left: 0;
  height: 40px;
  min-width: 88px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  background: #1890ff;
  border: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send-button:not(:disabled):hover {
  background: #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.25);
}
.send-button:disabled {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #bfbfbf;
  box-shadow: none;
}
.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.message-item {
  padding: 0 24px;
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
  max-height: none !important;
  overflow-y: visible !important;
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
.generic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.generic-header:hover {
  background: #e8e8e8;
}
.generic-title {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 13px;
}
.generic-content {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-size: 13px;
}
.message-item.generic {
  margin-bottom: 12px;
}
.message-item.generic .message-content {
  flex: 1;
  max-width: 100%;
}
.message-item.is-generic {
  flex-direction: row-reverse;
}
.message-item.is-generic .message-text {
  background-color: #e6f7ff;
  border-top-right-radius: 0;
  padding: 0;
  overflow: hidden;
}
.generic-trigger {
  padding: 12px 16px;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}
.generic-trigger:hover {
  background-color: #bae7ff;
}
.message-text.has-content .generic-trigger {
  background-color: #bae7ff;
}
.repository-button {
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
  height: 32px;
  padding: 0 12px;
}
.repository-header {
  margin-bottom: 16px;
}
.repository-list {
  height: calc(100vh - 180px);
  overflow-y: auto;
}
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.file-name {
  font-size: 14px;
  color: #333;
}
.file-actions {
  display: flex;
  gap: 8px;
}
.repository-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
</style>
