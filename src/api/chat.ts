import axiosUtil from "@/util/request";

// 单条消息结构
export interface ChatMessage {
  role: "system" | "human" | "ai";
  text: string;
}

// 对话详情结构
export interface ChatDetail {
  id: string;
  username: string;
  message: ChatMessage[];
  title: string;
}

// 通用响应结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const getChatList = () => {
  return axiosUtil.request({
    url: "/llm/chatList",
    method: "get",
  });
};

export const getChat = (chatId: string) => {
  return axiosUtil.request<ApiResponse<ChatDetail>>({
    url: "/llm/chat",
    method: "get",
    params: {
      chatId: chatId,
    },
  });
};

export const deleteChat = (chatId: string) => {
  return axiosUtil.request({
    url: "/llm/chat",
    method: "delete",
    params: {
      chatId: chatId,
    },
  });
};

export const updateChatTitle = (chatId: string, title: string) => {
  return axiosUtil.request({
    url: "/llm/chat",
    method: "put",
    params: {
      chatId: chatId,
      title: title,
    },
  });
};

export const createChat = () => {
  return axiosUtil.request({
    url: "/llm/createChat",
    method: "post",
  });
};
