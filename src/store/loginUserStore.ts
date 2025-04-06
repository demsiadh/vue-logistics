import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getLoginUserStatus } from "@/api/user";

export const loginUserStore = defineStore("userLogin", () => {
  const loginUser = ref<any>({
    name: "未登录",
  });

  // 获取登录用户
  async function getLoginUser() {
    const res = await getLoginUserStatus();
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data;
    }
  }

  // 设置登录用户
  function setLoginUser(newUser: any) {
    loginUser.value = newUser;
  }

  return { loginUser, getLoginUser, setLoginUser };
});
