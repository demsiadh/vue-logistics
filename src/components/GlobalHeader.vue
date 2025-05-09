<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="150px">
        <div class="titleBar">
          <img class="logo" src="../assets/logo.png" alt="logo" />
          <div class="title">{{ PROJECT_NAME }}</div>
        </div>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          v-model:openKeys="openKeys"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>
      <a-col flex="200px">
        <div class="rightBar">
          <div class="user-info">
            <span class="username">{{
              userStore.loginUser.username ?? "无名"
            }}</span>
            <a-button type="primary" class="logout-btn" @click="logout"
              >注销
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { h, onMounted, ref } from "vue";
import {
  HomeFilled,
  UserOutlined,
  GithubOutlined,
  OrderedListOutlined,
  CarOutlined,
  ShopOutlined,
  CiCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons-vue";
import { MenuProps, message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { ROUTER_CONFIG } from "@/config/constants";
import { defaultUser, loginUserStore } from "@/store/loginUserStore";
import { PROJECT_NAME } from "@/config/project";

const userStore = loginUserStore();
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
    key: ROUTER_CONFIG.ORDER.PATH,
    icon: () => h(OrderedListOutlined),
    label: ROUTER_CONFIG.ORDER.NAME_CN,
    title: ROUTER_CONFIG.ORDER.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.OUTLET.PATH,
    icon: () => h(ShopOutlined),
    label: ROUTER_CONFIG.OUTLET.NAME_CN,
    title: ROUTER_CONFIG.OUTLET.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.ROUTE.PATH,
    icon: () => h(CiCircleOutlined),
    label: ROUTER_CONFIG.ROUTE.NAME_CN,
    title: ROUTER_CONFIG.ROUTE.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.VEHICLE.PATH,
    icon: () => h(CarOutlined),
    label: ROUTER_CONFIG.VEHICLE.NAME_CN,
    title: ROUTER_CONFIG.VEHICLE.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.CHAT.PATH,
    icon: () => h(MessageOutlined),
    label: ROUTER_CONFIG.CHAT.NAME_CN,
    title: ROUTER_CONFIG.CHAT.NAME_CN,
  },
  {
    key: ROUTER_CONFIG.PARENT.PATH,
    icon: () => h(GithubOutlined),
    label: h(
      "a",
      { href: "https://github.com/demsiadh/vue-logistics", target: "_blank" },
      "项目源码"
    ),
    title: "项目源码",
  },
]);

// 菜单点击事件
const router = useRouter();
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  });
};

const current = ref<string[]>([]);
const openKeys = ref<string[]>([]);

// 在组件挂载时，根据当前路由路径设置 current 的值
onMounted(() => {
  const path = router.currentRoute.value.path;
  current.value = [path];
  // 如果是子菜单，设置父菜单为展开状态
  if (path.startsWith("/vehicle/")) {
    openKeys.value = ["vehicle"];
  }
});

router.afterEach((to) => {
  current.value = [to.path];
  // 如果是子菜单，设置父菜单为展开状态
  if (to.path.startsWith("/vehicle/")) {
    openKeys.value = ["vehicle"];
  } else {
    openKeys.value = [];
  }
});

const logout = () => {
  userStore.loginUser.username = defaultUser.username;
  localStorage.removeItem("logistics_token");
  message.success("注销成功");
  router.push({
    path: ROUTER_CONFIG.LOGIN.PATH,
  });
};
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

#globalHeader .rightBar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

#globalHeader .user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

#globalHeader .username {
  font-size: 14px;
  color: #333;
  display: inline-flex;
  align-items: center;
}

#globalHeader .logout-btn {
  height: 32px;
  padding: 0 16px;
  font-size: 14px;
}

:deep(.ant-menu-submenu-title) {
  display: flex;
  align-items: center;
}

:deep(.ant-menu-item) {
  display: flex;
  align-items: center;
}
</style>
