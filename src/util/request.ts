import axios from "axios";
import { Modal } from "ant-design-vue";

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
        Modal.error({
          title: "操作失败",
          content: "登录已过期，请登录",
          okText: "去登录",
          centered: true,
          maskClosable: true,
          onOk() {
            window.location.href = "/login";
          },
        });
      }
    }
    if (data.code !== 0) {
      Modal.error({
        title: "操作失败",
        content: data.message,
        okText: "确认",
        centered: true,
        maskClosable: true,
      });
      return Promise.reject(data);
    }
    return response;
  },
  function (error) {
    Modal.error({
      title: "操作失败",
      content: "服务器错误",
      okText: "确认",
      centered: true,
      maskClosable: true,
    });
    return Promise.reject(error);
  }
);

export default axiosUtil;
