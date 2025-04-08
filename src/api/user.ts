import axiosUtil from "@/util/request";
import { convertToFormData } from "@/util/params";

interface UserListPostBody {
  name: string;
  phone: string;
  email: string;
  status: number;
  skip: number;
  limit: number;
}

export const getUserList = (params: UserListPostBody) => {
  return axiosUtil.request({
    url: "/user/list",
    method: "post",
    data: { params },
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface LoginUserQueryParams {
  name: string;
  password: string;
}

export const loginUser = (params: LoginUserQueryParams) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/user/login",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getLoginUserStatus = () => {
  return axiosUtil.request({
    url: "/user/loginStatus",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
