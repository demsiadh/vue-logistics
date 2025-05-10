import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface vehicleListPostBody {
  plateNumber: string;
  type: number;
  status: number;
  routeId: string;
  routeName: string;
  page: {
    skip: number;
    limit: number;
  };
}

export const getVehicleList = (params: vehicleListPostBody) => {
  return axiosUtil.request({
    url: "/vehicle/list",
    method: "post",
    data: params,
  });
};

interface UpdatevehicleDTO {
  plateNumber: string;
  type: string;
  loadCapacity: string;
  status: string;
  routeId: string;
  remarks: string;
  lng?: string;
  lat?: string;
}

export const updatevehicle = (params: UpdatevehicleDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/vehicle/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
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
  lng?: string;
  lat?: string;
}

export const createvehicle = (params: CreatevehicleDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/vehicle/create",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getVehicleTotalCount = (params: vehicleListPostBody) => {
  return axiosUtil.request({
    url: "/vehicle/total",
    method: "post",
    data: params,
  });
};

export const deletevehicle = (params: string) => {
  return axiosUtil.request({
    url: "/vehicle/delete",
    method: "delete",
    params: {
      plateNumber: params,
    },
  });
};
