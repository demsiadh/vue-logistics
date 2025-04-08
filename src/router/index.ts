import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import UserView from "@/views/UserView.vue";
import { ROUTER_CONFIG } from "@/config/router";
import LoginLayout from "@/layouts/LoginLayout.vue";
import BasicLayout from "@/layouts/BasicLayout.vue";
import { loginUserStore } from "@/store/loginUserStore";
import { message } from "ant-design-vue";
import NotFoundView from "@/views/NotFoundView.vue";

const routes: Array<RouteRecordRaw> = [
  // 主页面（需要登录）
  {
    path: ROUTER_CONFIG.PARENT.PATH,
    name: ROUTER_CONFIG.PARENT.NAME,
    component: BasicLayout,
    children: [
      {
        path: ROUTER_CONFIG.HOME.PATH,
        name: ROUTER_CONFIG.HOME.NAME,
        component: HomeView,
      },
      {
        path: ROUTER_CONFIG.USER.PATH,
        name: ROUTER_CONFIG.USER.NAME,
        component: UserView,
      },
    ],
  },
  // 不需要登录的页面
  {
    path: ROUTER_CONFIG.LOGIN.PATH,
    name: ROUTER_CONFIG.LOGIN.NAME,
    component: LoginLayout,
  },
  {
    path: "/:pathMatch(.*)*", // 通配符路由（匹配所有未定义路径）
    name: "NotFound",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = loginUserStore();
  const isLoginPage = to.path === "/login";
  let isLoggedIn =
    userStore.loginUser.username !== "" &&
    localStorage.getItem("logistics_token") !== null;
  try {
    // 尝试获取登录用户信息
    if (!isLoggedIn) {
      await userStore.getLoginUser();
      isLoggedIn =
        userStore.loginUser.username !== "" &&
        localStorage.getItem("logistics_token") !== null;
    }
  } catch (error) {
    // 如果获取登录用户信息时出错，说明可能未登录，后续会处理
    console.error("获取登录用户信息时出错:", error);
  }

  if (!isLoggedIn && !isLoginPage) {
    // 用户未登录且访问的不是登录页面，跳转到登录页面
    message.error("您未登录，请先登录！");
    next("/login");
    return;
  }

  if (isLoggedIn && isLoginPage) {
    message.error("您已登录，请勿重复登录！");
    next("/");
    return;
  }
  if (isLoggedIn && to.path === "/") {
    next("/home");
    return;
  }

  // 其他情况正常放行
  next();
});
export default router;
