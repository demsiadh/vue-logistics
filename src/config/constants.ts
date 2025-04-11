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
  ORDER: {
    PATH: "/order",
    NAME: "order",
    NAME_CN: "订单管理",
  },
  VEHICLE: {
    PATH: "/vehicle/list",
    NAME: "vehicle",
    NAME_CN: "车辆管理",
  },
  FENCE: {
    PATH: "/vehicle/fence",
    NAME: "fence",
    NAME_CN: "电子围栏",
  },
  OUTLET: {
    PATH: "/vehicle/outlet",
    NAME: "outlet",
    NAME_CN: "营业网点",
  },
  LOGIN: {
    PATH: "/login",
    NAME: "login",
    NAME_CN: "登录",
  },
};

interface UserStatus {
  VALUE: number;
  NAME: string;
  COLOR: string;
}

export const USER_STATUS: Record<string, UserStatus> = {
  ALL: {
    VALUE: 0,
    NAME: "全部",
    COLOR: "null",
  },
  ACTIVE: {
    VALUE: 1,
    NAME: "活跃",
    COLOR: "green",
  },
  BANNED: {
    VALUE: 2,
    NAME: "禁用",
    COLOR: "red",
  },
  DELETED: {
    VALUE: 3,
    NAME: "删除",
    COLOR: "gray",
  },
};
