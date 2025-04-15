/**
 * 将对象转换为FormData
 * @param params 需要转换的参数对象
 * @returns 包含所有参数的FormData实例
 */
export function convertToFormData<T extends Record<string, any>>(
  params: T
): FormData {
  const formData = new FormData();

  Object.entries(params).forEach(([key, value]) => {
    // 处理数组和嵌套对象（可选）
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${key}[]`, item));
    } else if (typeof value === "object" && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      // 确保数字类型被转换为字符串
      formData.append(key, String(value));
    }
  });

  return formData;
}
