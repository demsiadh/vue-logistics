interface RouterConfig {
  PATH: string;
  NAME: string;
  NAME_CN: string;
}

export const ROUTER_CONFIG: Record<string, RouterConfig> = {
  HOME: {
    PATH: "/",
    NAME: "home",
    NAME_CN: "首页",
  },
  USER: {
    PATH: "/user",
    NAME: "user",
    NAME_CN: "用户管理",
  },
};
