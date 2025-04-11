<template>
  <div id="login-layout">
    <div class="login-background"></div>
    <div class="login-card">
      <div class="logo-container">
        <img src="/logo.png" alt="Logo" class="logo" v-if="false" />
        <h1 class="login-title">{{ PROJECT_NAME }}</h1>
      </div>
      <h2 class="login-subtitle">登录系统</h2>
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
          <a-input
            v-model:value="loginForm.name"
            placeholder="用户名"
            size="large"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <!-- 滑动验证码 -->
        <a-form-item
          name="captcha"
          :rules="[{ required: true, validator: validateCaptcha }]"
        >
          <div class="slider-captcha">
            <div class="slider-container" ref="sliderContainer">
              <div
                class="slider-bg"
                :class="{ 'slider-success': captchaVerified }"
              ></div>
              <div
                class="slider-button"
                ref="sliderButton"
                :class="{ 'slider-success': captchaVerified }"
                @mousedown="startSlide"
                @touchstart="startSlide"
              >
                <span v-if="!captchaVerified">
                  <swap-right-outlined />
                </span>
                <span v-else>
                  <check-outlined />
                </span>
              </div>
              <div class="slider-text">
                {{ captchaVerified ? "验证通过" : "滑动滑块验证" }}
              </div>
            </div>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            class="login-form-button"
            size="large"
            :loading="loading"
            :disabled="!captchaVerified"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
      <div class="login-footer">
        <p>
          © {{ new Date().getFullYear() }} {{ PROJECT_NAME }} - 物流管理系统
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from "vue";
import {
  UserOutlined,
  LockOutlined,
  SwapRightOutlined,
  CheckOutlined,
} from "@ant-design/icons-vue";
import { loginUser } from "@/api/user";
import { loginUserStore } from "@/store/loginUserStore";
import router from "@/router";
import { ROUTER_CONFIG } from "@/config/constants";
import { message } from "ant-design-vue";
import { PROJECT_NAME } from "@/config/project";

const loginForm = reactive({
  name: "",
  password: "",
});
const userStore = loginUserStore();
const loading = ref(false);

// 滑动验证码相关
const sliderContainer = ref(null);
const sliderButton = ref(null);
const captchaVerified = ref(false);
let startX = 0;
let buttonLeft = 0;
let moving = false;

// 验证滑动验证码
const validateCaptcha = (_, value) => {
  if (captchaVerified.value) {
    return Promise.resolve();
  }
  return Promise.reject("请完成滑动验证");
};

// 开始滑动
const startSlide = (e) => {
  if (captchaVerified.value) return;

  e.preventDefault();
  moving = true;
  startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  buttonLeft = sliderButton.value.offsetLeft;

  document.addEventListener("mousemove", moveSlide);
  document.addEventListener("touchmove", moveSlide);
  document.addEventListener("mouseup", endSlide);
  document.addEventListener("touchend", endSlide);
};

// 滑动过程
const moveSlide = (e) => {
  if (!moving) return;

  const currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
  const moveX = currentX - startX;
  const containerWidth = sliderContainer.value.clientWidth;
  const buttonWidth = sliderButton.value.clientWidth;
  const maxMove = containerWidth - buttonWidth;

  let newLeft = buttonLeft + moveX;
  if (newLeft < 0) newLeft = 0;
  if (newLeft > maxMove) newLeft = maxMove;

  sliderButton.value.style.left = newLeft + "px";

  // 如果滑动到最右侧，验证成功
  if (newLeft >= maxMove - 5) {
    captchaVerified.value = true;
    moving = false;
    removeEventListeners();
  }
};

// 结束滑动
const endSlide = () => {
  if (!moving) return;
  moving = false;

  // 如果未验证成功，则回到起始位置
  if (!captchaVerified.value) {
    sliderButton.value.style.left = "0px";
  }

  removeEventListeners();
};

// 移除事件监听
const removeEventListeners = () => {
  document.removeEventListener("mousemove", moveSlide);
  document.removeEventListener("touchmove", moveSlide);
  document.removeEventListener("mouseup", endSlide);
  document.removeEventListener("touchend", endSlide);
};

// 重置验证码
const resetCaptcha = () => {
  captchaVerified.value = false;
  if (sliderButton.value) {
    sliderButton.value.style.left = "0px";
  }
};

// 组件卸载时清理事件
onUnmounted(() => {
  removeEventListeners();
});

const onFinish = () => {
  if (!captchaVerified.value) {
    message.error("请先完成人机验证");
    return;
  }

  loading.value = true;
  loginUser(loginForm)
    .then((res) => {
      if (res.data.code === 0 && res.data.data) {
        userStore.setLoginUser(res);
        message.success("登录成功");
        router.push({
          path: ROUTER_CONFIG.HOME.PATH,
        });
      } else {
        message.error(res.data.message || "登录失败，请检查用户名和密码");
        // 登录失败时重置验证码
        resetCaptcha();
      }
    })
    .catch((error) => {
      console.error("登录出错:", error);
      message.error("登录失败，请稍后重试");
      // 登录失败时重置验证码
      resetCaptcha();
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<style scoped>
#login-layout {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  position: relative;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1976d2 0%, #64b5f6 50%, #bbdefb 100%);
  background-size: cover;
  z-index: -1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 30px 40px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
  backdrop-filter: blur(10px);
}

.logo-container {
  margin-bottom: 15px;
}

.logo {
  height: 60px;
  margin-bottom: 10px;
}

.login-title {
  margin-bottom: 5px;
  font-size: 28px;
  color: #1976d2;
  font-weight: 600;
}

.login-subtitle {
  margin-bottom: 20px;
  color: #555;
  font-size: 16px;
  font-weight: normal;
}

.login-form {
  margin-top: 25px;
}

.ant-input {
  font-size: 16px;
}

.login-form-button {
  width: 100%;
  font-size: 16px;
  height: 45px;
  border-radius: 4px;
  margin-top: 10px;
  background: #1976d2;
  border-color: #1976d2;
}

.login-footer {
  margin-top: 20px;
  color: #666;
  font-size: 13px;
}

/* 添加一些响应式设计 */
@media (max-width: 576px) {
  .login-card {
    width: 90%;
    padding: 20px;
  }
}

/* 输入框悬停效果 */
:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input:hover) {
  border-color: #1976d2;
}

/* 按钮悬停效果 */
.login-form-button:hover,
.login-form-button:focus {
  background: #1565c0;
  border-color: #1565c0;
}

/* 滑动验证码样式 */
.slider-captcha {
  width: 100%;
  margin-bottom: 10px;
}

.slider-container {
  position: relative;
  width: 100%;
  height: 40px;
  background-color: #f5f5f5;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.slider-bg {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background-color: #e1f5fe;
  transition: background-color 0.3s ease;
}

.slider-bg.slider-success {
  background-color: #e8f5e9;
  width: 100%;
}

.slider-button {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border: none;
  background-color: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.3s ease;
}

.slider-button.slider-success {
  background-color: #4caf50;
}

.slider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  user-select: none;
  z-index: 5;
}
</style>
