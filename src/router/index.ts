import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import UserView from "@/views/UserView.vue";
import { ROUTER_CONFIG } from "@/config/router";
import LoginLayout from "@/layouts/LoginLayout.vue";
import BasicLayout from "@/layouts/BasicLayout.vue";
import { loginUserStore } from "@/store/loginUserStore";
import { message } from "ant-design-vue";

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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
router.beforeEach(async (to, from, next) => {
  const userStore = loginUserStore();
  const isLoginPage = to.path === "/login";

  if (userStore.loginUser.value && !isLoginPage) {
    next("/login");
  }
  next("/home");
});
export default router;
