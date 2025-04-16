import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface vehicleListPostBody {
  plateNumber: string;
  type: number;
  status: number;
  routeId: string;
  routeName: string;
  skip: number;
  limit: number;
}

export const getVehicleList = (params: vehicleListPostBody) => {
  return axiosUtil.request({
    url: "/vehicle/list",
    method: "post",
    data: params,
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface UpdatevehicleDTO {
  plateNumber: string;
  type: string;
  loadCapacity: string;
  status: string;
  routeId: string;
  remarks: string;
}

export const updatevehicle = (params: UpdatevehicleDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/vehicle/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface CreatevehicleDTO {
  plateNumber: string;
  type: string;
  loadCapacity: string;
  status: string;
  routeId: string;
  remarks: string;
}

export const createvehicle = (params: CreatevehicleDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/vehicle/create",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getTotalCount = () => {
  return axiosUtil.request({
    url: "/vehicle/total",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const deletevehicle = (params: string) => {
  return axiosUtil.request({
    url: "/vehicle/delete",
    method: "delete",
    params: {
      plateNumber: params,
    },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
