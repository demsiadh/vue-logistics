<template>
  <div id="login-layout">
    <div class="login-container">
      <h1 class="login-title">{{ PROJECT_NAME }}</h1>
      <a-form
        :model="loginForm"
        name="normal_login"
        class="login-form"
        @finish="onFinish"
      >
        <a-form-item
          name="name"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model:value="loginForm.name" placeholder="用户名" />
        </a-form-item>
        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="密码"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" class="login-form-button">
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { loginUser } from "@/api/user";
import { loginUserStore } from "@/store/loginUserStore";
import router from "@/router";
import { ROUTER_CONFIG } from "@/config/router";
import { message } from "ant-design-vue";
import { PROJECT_NAME } from "@/config/project";

const loginForm = reactive({
  name: "",
  password: "",
});
const userStore = loginUserStore();

const onFinish = () => {
  loginUser(loginForm).then((res) => {
    if (res.data.code === 0 && res.data.data) {
      userStore.setLoginUser(res);
      message.success("登录成功");
      router.push({
        path: ROUTER_CONFIG.HOME.PATH,
      });
    }
  });
};
</script>

<style scoped>
#login-layout {
  height: 100vh; /* 设置页面高度为100% */
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  text-align: center;
}

.login-title {
  margin-bottom: 20px;
  font-size: 24px;
}

.login-form {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.ant-input {
  font-size: 16px;
}

.login-form-button {
  width: 100%;
  font-size: 16px;
}
</style>
