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
    data: params,
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

export const updateUser = (params: UserListPostBody) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/user/update",
    method: "put",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

interface AddUserDTO {
  name: string;
  phone: string;
  email: string;
  password: string;
  rePassword: string;
}
export const createUser = (params: AddUserDTO) => {
  const formData = convertToFormData(params);
  return axiosUtil.request({
    url: "/user/create",
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
    url: "/user/total",
    method: "get",
    params: {},
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};

export const deleteUser = (params: { name: string }) => {
  return axiosUtil.request({
    url: "/user/delete",
    method: "delete",
    params: params,
    headers: {
      logistics_token: localStorage.getItem("logistics_token") || "",
    },
  });
};
