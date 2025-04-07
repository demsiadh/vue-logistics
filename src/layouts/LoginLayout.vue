<template>
  <div id="login-layout">
    <h1 class="login-title">领运物流</h1>
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
</template>

<script setup>
import { reactive } from "vue";
import { loginUser } from "@/api/user";
import { loginUserStore } from "@/store/loginUserStore";
import router from "@/router";
import { ROUTER_CONFIG } from "@/config/router";

const loginForm = reactive({
  name: "",
  password: "",
});
const userStore = loginUserStore();

const onFinish = () => {
  loginUser(loginForm).then((res) => {
    if (res.data.code === 0 && res.data.data) {
      userStore.setLoginUser(res);
      router.push(ROUTER_CONFIG.HOME.PATH);
    }
  });
};
</script>

<style scoped>
.login-title {
  text-align: center;
  margin-bottom: 20px;
}

.login-form {
  max-width: 300px;
  margin: 100px auto;
}

.login-form-button {
  width: 100%;
}
</style>
