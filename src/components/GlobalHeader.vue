<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="150px">
        <div class="titleBar">
          <img class="logo" src="../assets/logo.png" alt="logo" />
          <div class="title">金运物流</div>
        </div>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>
      <a-col flex="80px">
        <div class="userLoginStatus">
          <a-button>登录</a-button>
        </div>
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { h, ref } from "vue";
import { HomeFilled, UserOutlined } from "@ant-design/icons-vue";
import { MenuProps } from "ant-design-vue";
import { useRouter } from "vue-router";
import { ROUTER_CONFIG } from "@/config/router";

const items = ref<MenuProps["items"]>([
  {
    key: ROUTER_CONFIG.HOME.PATH,
    icon: () => h(HomeFilled),
    label: ROUTER_CONFIG.HOME.NAME_CN,
    title: ROUTER_CONFIG.HOME.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.USER.PATH,
    icon: () => h(UserOutlined),
    label: ROUTER_CONFIG.USER.NAME_CN,
    title: ROUTER_CONFIG.USER.NAME_CN,
  },
  {
    key: "alipay",
    label: h(
      "a",
      { href: "https://antdv.com", target: "_blank" },
      "Navigation Four - Link"
    ),
    title: "Navigation Four - Link",
  },
]);
// 菜单点击事件
const router = useRouter();
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  });
};

const current = ref<string[]>(["mail"]);
router.afterEach((to) => {
  current.value = [to.path];
});
</script>

<style>
#globalHeader .titleBar {
  display: flex;
  align-items: center;
}

#globalHeader .title {
  color: black;
  font-size: 18px;
  margin-left: 10px;
}
#globalHeader .logo {
  width: 32px;
  height: 32px;
}
</style>
