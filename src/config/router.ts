interface RouterConfig {
  PATH: string;
  NAME: string;
  NAME_CN: string;
}

export const ROUTER_CONFIG: Record<string, RouterConfig> = {
  PARENT: {
    PATH: "/",
    NAME: "parent",
    NAME_CN: "父路由",
  },
  HOME: {
    PATH: "/home",
    NAME: "home",
    NAME_CN: "首页",
  },
  USER: {
    PATH: "/user",
    NAME: "user",
    NAME_CN: "用户管理",
  },
  LOGIN: {
    PATH: "/login",
    NAME: "login",
    NAME_CN: "登录",
  },
};
