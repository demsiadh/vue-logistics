import axiosUtil from "@/util/request";

export const getChatList = () => {
  return axiosUtil.request({
    url: "/llm/chatList",
    method: "get",
  });
};

export const getChat = (chatId: string) => {
  return axiosUtil.request({
    url: "/llm/chat",
    method: "post",
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
