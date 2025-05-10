import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface RouteListPostBody {
  routeId?: string; // 线路ID
  name?: string; // 线路名称
  type?: number; // 线路类型
  status?: number; // 线路状态
  page: {
    skip: number;
    limit: number;
  };
}

export const getRouteList = (params: RouteListPostBody) => {
  return axiosUtil.request({
    url: "/route/list",
    method: "post",
    data: params,
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
  startOutlet?: string; // 起始网点ID
  endOutlet?: string; // 终点网点ID
}

export const updateRoute = (params: UpdateRouteDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/route/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
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
  startOutlet?: string; // 起始网点ID
  endOutlet?: string; // 终点网点ID
}

export const createRoute = (params: CreateRouteDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/route/create",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getRouteTotalCount = (params: RouteListPostBody) => {
  return axiosUtil.request({
    url: "/route/total",
    method: "post",
    data: params,
  });
};

export const deleteRoute = (routeId: string) => {
  return axiosUtil.request({
    url: "/route/delete",
    method: "delete",
    params: {
      routeId: routeId,
    },
  });
};
