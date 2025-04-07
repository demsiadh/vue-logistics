import { defineStore } from "pinia";
import { ref } from "vue";
import { getLoginUserStatus } from "@/api/user";

export const loginUserStore = defineStore("userLogin", () => {
  const loginUser = ref<any>({});

  // 获取登录状态（带 token 验证）
  const getLoginUser = async () => {
    try {
      const token = localStorage.getItem("logistics_token");
      if (!token) {
        loginUser.value = null;
        return;
      }

      const res = await getLoginUserStatus();
      if (res.data.code === 0) {
        loginUser.value = res.data.data;
      } else {
        // token 无效时清理
        localStorage.removeItem("logistics_token");
        loginUser.value = null;
      }
      console.log(loginUser.value);
    } catch (error) {
      localStorage.removeItem("logistics_token");
      loginUser.value = null;
      throw error; // 抛出错误让路由守卫捕获
    }
  };
  // 设置登录用户
  function setLoginUser(res: any) {
    loginUser.value = res.data.data;
    localStorage.setItem("logistics_token", res.headers.get("logistics_token"));
  }

  return { loginUser, getLoginUser, setLoginUser };
});
