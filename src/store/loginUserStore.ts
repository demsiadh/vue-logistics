import { defineStore } from "pinia";
import { ref } from "vue";
import { getLoginUserStatus } from "@/api/user";

const defaultUser = {
  username: "",
};

export const loginUserStore = defineStore("userLogin", () => {
  const loginUser = ref<any>(defaultUser);

  // 获取登录状态（带 token 验证）
  const getLoginUser = async () => {
    try {
      if (!localStorage.getItem("logistics_token")) {
        loginUser.value = defaultUser;
        return;
      }
      const res = await getLoginUserStatus();
      if (res.data.code === 0) {
        loginUser.value = {
          username: res.data.data.name,
        };
      } else {
        // token 无效时清理
        localStorage.removeItem("logistics_token");
        loginUser.value = defaultUser;
      }
    } catch (error) {
      localStorage.removeItem("logistics_token");
      loginUser.value = defaultUser;
      throw error; // 抛出错误让路由守卫捕获
    }
  };

  // 设置登录用户
  function setLoginUser(res: any) {
    loginUser.value.username = res.data.data.username;
    localStorage.setItem("logistics_token", res.headers.get("logistics_token"));
  }

  return { loginUser, getLoginUser, setLoginUser };
});
