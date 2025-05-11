import axios from "axios";
import { message, Modal } from "ant-design-vue";

interface ResponseData {
  code: number;
  message: string;
  data: any;
}

const axiosUtil = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    logistics_token: localStorage.getItem("logistics_token") || "",
  },
});
// 添加请求拦截器
axiosUtil.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axiosUtil.interceptors.response.use(
  function (response) {
    const data = response.data as ResponseData;
    console.log(data);
    if (data.code === 70001) {
      if (!window.location.pathname.includes("/login")) {
        message.error("登录已过期，请登录");
        window.location.href = "/login";
      }
    }
    if (data.code !== 0) {
      message.error(data.message);
      return Promise.reject(data);
    }
    return response;
  },
  function (error) {
    message.error("服务器错误");
    return Promise.reject(error);
  }
);

export default axiosUtil;
