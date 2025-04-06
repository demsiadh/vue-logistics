import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import UserView from "@/views/UserView.vue";
import { ROUTER_CONFIG } from "@/config/router";

const routes: Array<RouteRecordRaw> = [
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
