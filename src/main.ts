import { createApp } from "vue";
import { createPinia } from "pinia";
import Antd from "ant-design-vue";
import App from "./App.vue";
import router from "./router";
import "ant-design-vue/dist/reset.css";
import BaiduMap from "vue-baidu-map-3x";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(Antd);
app.use(BaiduMap, {
  ak: "yGxBefxFCGWHDQykxuH514lqKYOiHTLk",
});
app.mount("#app");
