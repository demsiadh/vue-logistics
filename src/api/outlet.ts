import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface OutletListPostBody {
  name: string;
  status: number;
  province: string;
  city: string;
  skip: number;
  limit: number;
}

export const getOutletList = (params: OutletListPostBody) => {
  return axiosUtil.request({
    url: "/outlet/list",
    method: "post",
    data: params,
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface UpdateOutletDTO {
  id: string;
  name: string;
  phone: string;
  detailAddress: string;
  businessHours: string;
  lng: string;
  lat: string;
  status: number;
  remark: string;
}

export const updateOutlet = (params: UpdateOutletDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/outlet/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface CreateOutletDTO {
  name: string;
  phone: string;
  province: string;
  city: string;
  detailAddress: string;
  businessHours: string;
  lng: string;
  lat: string;
  status: number;
  remark: string;
}

export const createOutlet = (params: CreateOutletDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/outlet/create",
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
    url: "/outlet/total",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const deleteOutlet = (params: string) => {
  return axiosUtil.request({
    url: "/outlet/delete",
    method: "delete",
    params: {
      outletId: params,
    },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
export const getAllProvincesAndCities = () => {
  return axiosUtil.request({
    url: "/outlet/allProvincesAndCities",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
