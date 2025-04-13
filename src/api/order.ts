import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface OrderListPostBody {
  orderId: string;
  phone: string;
  status: number;
  startTime: string;
  endTime: string;
}
// Page 分页参数结构体
interface Page {
  skip: number;
  limit: number;
}

export const getOrderList = (params: OrderListPostBody, page: Page) => {
  return axiosUtil.request({
    url: "/order/list",
    method: "post",
    data: {
      ...params,
      page: {
        ...page,
      },
    },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface UpdateOrderDTO {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
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
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface CreateOrderDTO {
  customerName: string;
  phone: string;
  address: string;
  status: number;
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
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const getTotalCount = () => {
  return axiosUtil.request({
    url: "/order/total",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const deleteOrder = (params: string) => {
  return axiosUtil.request({
    url: "/order/delete",
    method: "delete",
    params: {
      orderId: params,
    },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
