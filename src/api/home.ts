import axiosUtil from "@/util/request";

export const getOutletView = () => {
  return axiosUtil.request({
    url: "/home/outlet",
    method: "get",
    data: {},
  });
};

export const getOrderView = () => {
  return axiosUtil.request({
    url: "/home/order",
    method: "get",
    data: {},
  });
};

export const getRouteView = () => {
  return axiosUtil.request({
    url: "/home/route",
    method: "get",
    data: {},
  });
};

export const getVehicleView = () => {
  return axiosUtil.request({
    url: "/home/vehicle",
    method: "get",
    data: {},
  });
};
