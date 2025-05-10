import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface OrderListPostBody {
  orderId: string;
  phone: string;
  status: number;
  startTime: string;
  endTime: string;
  page: {
    skip: number;
    limit: number;
  };
}

export const getOrderList = (params: OrderListPostBody) => {
  return axiosUtil.request({
    url: "/order/list",
    method: "post",
    data: params,
  });
};

interface UpdateOrderDTO {
  orderId: string;
  customerName: string;
  phone: string;
  status: number;
  remark: string;
}

export const updateOrder = (params: UpdateOrderDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/order/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

interface CreateOrderDTO {
  customerName: string;
  phone: string;
  startAddress: string;
  endAddress: string;
  startLng: number;
  startLat: number;
  endLng: number;
  endLat: number;
  weight: number;
  remark: string;
}

export const createOrder = (params: CreateOrderDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/order/create",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getOrderTotalCount = (params: OrderListPostBody) => {
  return axiosUtil.request({
    url: "/order/total",
    method: "post",
    data: params,
  });
};

export const deleteOrder = (params: string) => {
  return axiosUtil.request({
    url: "/order/delete",
    method: "delete",
    params: {
      orderId: params,
    },
  });
};

export const getOrderDetail = (params: string) => {
  return axiosUtil.request({
    url: "/order/detail",
    method: "get",
    params: {
      orderId: params,
    },
  });
};
