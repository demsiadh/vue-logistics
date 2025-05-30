import axiosUtil from "@/util/request";

// 文件类型枚举
export enum BusinessType {
  AIRepository = 1,
}

// 查询文件列表的参数
export interface FindFileListDTO {
  fileType?: BusinessType;
  fileName?: string;
  skip?: number;
  limit?: number;
}

// 文件信息接口
export interface FileInfo {
  id: string;
  fileType: BusinessType;
  fileName: string;
  fileSize: number;
  contentType: string;
  fileData?: string;
  VectorIds?: string[];
  uploadTime: string;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 上传文件
export const uploadFile = (file: File, fileType: BusinessType) => {
  const formData = new FormData();
  // 确保文件作为二进制数据传输
  formData.append("file", file, file.name);
  formData.append("fileType", fileType.toString());

  return axiosUtil.request<{ code: number; message: string; data: any }>({
    url: "/file/upload",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // 增加超时时间，因为文件处理可能需要较长时间
    timeout: 30000,
    // 确保正确处理二进制数据
    transformRequest: [(data) => data],
  });
};

// 删除文件
export const deleteFile = (fileId: string) => {
  return axiosUtil.request({
    url: "/file/delete",
    method: "delete",
    params: {
      fileId,
    },
  });
};

// 获取文件列表
export const getFileList = (params: FindFileListDTO) => {
  return axiosUtil.request<ApiResponse<FileInfo[]>>({
    url: "/file/list",
    method: "post",
    data: params,
  });
};

// 扩展Navigator类型定义
interface IENavigator extends Navigator {
  msSaveOrOpenBlob?: (blob: Blob, fileName: string) => void;
}

// 前端文件下载工具函数
export const downloadFileFromBase64 = (
  fileData: string,
  fileName: string,
  contentType: string
) => {
  try {
    // 解码Base64数据
    const binaryString = window.atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 创建Blob对象，强制设置为下载类型
    const blob = new Blob([bytes], {
      type: "application/octet-stream",
    });

    // 使用原生下载方式
    const nav = window.navigator as IENavigator;
    if (nav.msSaveOrOpenBlob) {
      // 针对IE浏览器
      nav.msSaveOrOpenBlob(blob, fileName);
      return true;
    }

    // 针对现代浏览器
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName; // 设置下载文件名
    link.style.display = "none";

    // 确保link被添加到DOM中
    document.body.appendChild(link);

    // 模拟点击
    if (link.click) {
      link.click();
    } else {
      // 针对某些可能不支持click()的浏览器
      const evt = document.createEvent("MouseEvents");
      evt.initEvent("click", true, true);
      link.dispatchEvent(evt);
    }

    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error("文件下载失败:", error);
    throw error;
  }
};
