// 定义路线接口
export interface RouteData {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  points: {
    lng: number;
    lat: number;
  }[];
  distance?: number;
  createTime?: string;
  updateTime?: string;
}

// 定义查询参数接口
export interface RouteQueryParams {
  routeId?: string;
  name?: string;
  type?: string;
  status?: string;
  pageSize?: number;
  current?: number;
}

// 定义响应接口
export interface RouteResponse {
  code: number;
  data: {
    list: RouteData[];
    total: number;
    pageSize: number;
    current: number;
  };
  message: string;
}

// 模拟路线数据
export const mockRoutes: RouteData[] = [
  {
    id: "R1001",
    name: "北京-天津线路",
    type: "1",
    status: "active",
    description: "北京到天津的常规线路，主要用于货物运输",
    points: [
      { lng: 116.404, lat: 39.915 },
      { lng: 116.502, lat: 39.722 },
      { lng: 116.683, lat: 39.548 },
      { lng: 116.912, lat: 39.342 },
      { lng: 117.201, lat: 39.123 },
    ],
    distance: 150,
    createTime: "2023-01-10 10:00:00",
    updateTime: "2023-05-15 14:30:00",
  },
  {
    id: "R1002",
    name: "北京-上海线路",
    type: "2",
    status: "active",
    description: "北京到上海的快速线路，主要用于重要商品运输",
    points: [
      { lng: 116.404, lat: 39.915 },
      { lng: 117.2, lat: 38.5 },
      { lng: 118.3, lat: 37.2 },
      { lng: 119.4, lat: 35.8 },
      { lng: 120.5, lat: 33.5 },
      { lng: 121.473, lat: 31.23 },
    ],
    distance: 1200,
    createTime: "2023-01-12 11:20:00",
    updateTime: "2023-06-01 09:15:00",
  },
  {
    id: "R1003",
    name: "北京-广州线路",
    type: "3",
    status: "active",
    description: "北京到广州的长途线路，适合大批量货物运输",
    points: [
      { lng: 116.404, lat: 39.915 },
      { lng: 115.5, lat: 37.8 },
      { lng: 114.6, lat: 35.5 },
      { lng: 113.8, lat: 32.7 },
      { lng: 113.5, lat: 29.8 },
      { lng: 113.3, lat: 26.5 },
      { lng: 113.264, lat: 23.129 },
    ],
    distance: 2200,
    createTime: "2023-01-15 09:30:00",
    updateTime: "2023-05-20 16:45:00",
  },
  {
    id: "R1004",
    name: "北京-武汉线路",
    type: "2",
    status: "active",
    description: "北京到武汉的中途线路，适合生鲜和时效性商品",
    points: [
      { lng: 116.404, lat: 39.915 },
      { lng: 115.7, lat: 38.3 },
      { lng: 114.9, lat: 36.6 },
      { lng: 114.3, lat: 34.8 },
      { lng: 114.298, lat: 30.584 },
    ],
    distance: 1100,
    createTime: "2023-02-05 08:45:00",
    updateTime: "2023-06-10 11:20:00",
  },
  {
    id: "R1005",
    name: "天津-西安线路",
    type: "1",
    status: "active",
    description: "天津到西安的物流线路，主要用于工业品运输",
    points: [
      { lng: 117.2, lat: 39.12 },
      { lng: 116.1, lat: 38.4 },
      { lng: 115.0, lat: 37.6 },
      { lng: 113.9, lat: 36.8 },
      { lng: 112.8, lat: 36.0 },
      { lng: 111.7, lat: 35.2 },
      { lng: 108.946, lat: 34.347 },
    ],
    distance: 980,
    createTime: "2023-02-10 14:30:00",
    updateTime: "2023-05-25 10:10:00",
  },
  {
    id: "R1006",
    name: "上海-杭州线路",
    type: "1",
    status: "active",
    description: "上海到杭州的短途线路，主要用于日常货物配送",
    points: [
      { lng: 121.473, lat: 31.23 },
      { lng: 121.2, lat: 30.8 },
      { lng: 120.8, lat: 30.5 },
      { lng: 120.209, lat: 30.246 },
    ],
    distance: 180,
    createTime: "2023-03-01 09:00:00",
    updateTime: "2023-06-15 13:40:00",
  },
  {
    id: "R1007",
    name: "广州-深圳线路",
    type: "1",
    status: "maintenance",
    description: "广州到深圳的城际线路，目前处于维护状态",
    points: [
      { lng: 113.264, lat: 23.129 },
      { lng: 113.8, lat: 22.8 },
      { lng: 114.057, lat: 22.543 },
    ],
    distance: 120,
    createTime: "2023-03-15 10:30:00",
    updateTime: "2023-06-20 15:25:00",
  },
  {
    id: "R1008",
    name: "北京-沈阳线路",
    type: "2",
    status: "active",
    description: "北京到沈阳的东北物流线路",
    points: [
      { lng: 116.404, lat: 39.915 },
      { lng: 116.8, lat: 40.3 },
      { lng: 117.5, lat: 41.0 },
      { lng: 118.3, lat: 41.7 },
      { lng: 119.1, lat: 42.4 },
      { lng: 123.429, lat: 41.796 },
    ],
    distance: 750,
    createTime: "2023-04-05 11:15:00",
    updateTime: "2023-06-25 09:30:00",
  },
];

// 模拟获取路线列表
export const getRouteList = (
  params: RouteQueryParams
): Promise<RouteResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = [...mockRoutes];

      // 过滤数据
      if (params.routeId) {
        filteredList = filteredList.filter((item) =>
          item.id.toLowerCase().includes(params.routeId!.toLowerCase())
        );
      }

      if (params.name) {
        filteredList = filteredList.filter((item) =>
          item.name.toLowerCase().includes(params.name!.toLowerCase())
        );
      }

      if (params.type) {
        filteredList = filteredList.filter((item) => item.type === params.type);
      }

      if (params.status) {
        filteredList = filteredList.filter(
          (item) => item.status === params.status
        );
      }

      // 总条数
      const total = filteredList.length;

      // 分页
      const pageSize = params.pageSize || 10;
      const current = params.current || 1;
      const start = (current - 1) * pageSize;
      const end = start + pageSize;

      // 返回分页后的数据
      resolve({
        code: 200,
        data: {
          list: filteredList.slice(start, end),
          total,
          pageSize,
          current,
        },
        message: "获取成功",
      });
    }, 300);
  });
};

// 模拟获取路线详情
export const getRouteDetail = (
  id: string
): Promise<{ code: number; data: RouteData | null; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const route = mockRoutes.find((item) => item.id === id);

      if (route) {
        resolve({
          code: 200,
          data: route,
          message: "获取成功",
        });
      } else {
        resolve({
          code: 404,
          data: null,
          message: "路线不存在",
        });
      }
    }, 300);
  });
};
