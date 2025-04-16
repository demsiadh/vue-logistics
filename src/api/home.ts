import axiosUtil from "@/util/request";

export const getOutletView = () => {
  return axiosUtil.request({
    url: "/home/outlet",
    method: "get",
    data: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getOrderView = () => {
  return axiosUtil.request({
    url: "/home/order",
    method: "get",
    data: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getRouteView = () => {
  return axiosUtil.request({
    url: "/home/route",
    method: "get",
    data: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getVehicleView = () => {
  return axiosUtil.request({
    url: "/home/vehicle",
    method: "get",
    data: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
