import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface RouteListPostBody {
  routeId?: string; // 线路ID
  name?: string; // 线路名称
  type?: number; // 线路类型
  status?: number; // 线路状态
  skip: number; // 分页参数
  limit: number; // 分页参数
}

export const getRouteList = (params: RouteListPostBody) => {
  return axiosUtil.request({
    url: "/route/list",
    method: "post",
    data: params,
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface UpdateRouteDTO {
  routeId: string; // 路线编号
  name: string; // 路线名称
  type: number; // 路线类型
  status: number; // 路线状态
  description: string; // 路线描述
  points: string; // 线路点位，采用GeoJSON格式
  distance: number; // 线路距离
}

export const updateRoute = (params: UpdateRouteDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/route/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface CreateRouteDTO {
  name: string; // 路线名称
  type: number; // 路线类型
  status: number; // 路线状态
  description: string; // 路线描述
  points: string; // 线路点位，采用GeoJSON格式
  distance: number; // 线路距离
}

export const createRoute = (params: CreateRouteDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/route/create",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getRouteTotalCount = () => {
  return axiosUtil.request({
    url: "/route/total",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const deleteRoute = (routeId: string) => {
  return axiosUtil.request({
    url: "/route/delete",
    method: "delete",
    params: {
      routeId: routeId,
    },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
