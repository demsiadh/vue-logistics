<template>
  <div class="vehicle-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="车牌号">
          <a-input
            v-model:value="searchForm.plateNumber"
            placeholder="请输入车牌号"
          />
        </a-form-item>
        <a-form-item label="车辆类型">
          <a-select v-model:value="searchForm.type" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">货车</a-select-option>
            <a-select-option value="2">面包车</a-select-option>
            <a-select-option value="3">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="车辆状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">运行中</a-select-option>
            <a-select-option value="2">维修中</a-select-option>
            <a-select-option value="3">空闲</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="线路ID">
          <a-input
            v-model:value="searchForm.routeId"
            placeholder="请输入线路ID"
          />
        </a-form-item>
        <a-form-item label="线路名称">
          <a-input
            v-model:value="searchForm.routeName"
            placeholder="请输入线路名称"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button @click="resetSearch">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 操作按钮 -->
    <div class="table-operations">
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        添加车辆
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="vehicleList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag
            :color="getStatusColor(record._originalStatus || record.status)"
          >
            {{ record.statusText }}
          </a-tag>
        </template>
        <template v-if="column.key === 'type'">
          {{ record.typeText }}
        </template>
        <template v-if="column.key === 'routeName'">
          {{ record.routeName || "未绑定线路" }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要完成该车辆的运输任务吗？"
              @confirm="handleCompleteTransport(record)"
            >
              <a>完成运输</a>
            </a-popconfirm>
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除这辆车吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑车辆弹窗 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
      width="800px"
    >
      <a-form
        :model="vehicleForm"
        :rules="formRules"
        ref="vehicleFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="车牌号" name="plateNumber">
          <a-input v-model:value="vehicleForm.plateNumber" />
        </a-form-item>
        <a-form-item label="车辆类型" name="type">
          <a-select v-model:value="vehicleForm.type">
            <a-select-option value="1">货车</a-select-option>
            <a-select-option value="2">面包车</a-select-option>
            <a-select-option value="3">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="载重量" name="loadCapacity">
          <a-input-number
            v-model:value="vehicleForm.loadCapacity"
            :min="0.1"
            :max="100"
            :precision="2"
            placeholder="请输入载重量"
            :step="0.1"
            style="width: 100%"
          />
          <span class="unit">吨</span>
        </a-form-item>
        <a-form-item label="当前负载" name="currentLoad">
          <a-input-number
            v-model:value="vehicleForm.currentLoad"
            :min="0"
            :max="100"
            :precision="2"
            placeholder="请输入当前负载"
            :step="0.1"
            style="width: 100%"
          />
          <span class="unit">吨</span>
        </a-form-item>
        <a-form-item label="车辆状态" name="status">
          <a-select v-model:value="vehicleForm.status">
            <a-select-option value="1">运行中</a-select-option>
            <a-select-option value="2">维修中</a-select-option>
            <a-select-option value="3">空闲</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="所属线路" name="routeId">
          <a-input
            v-model:value="vehicleForm.routeId"
            placeholder="请输入线路ID"
          />
        </a-form-item>
        <a-form-item label="当前位置" name="location">
          <div class="map-container">
            <baidu-map
              class="map"
              :center="mapCenter"
              :zoom="mapZoom"
              :scroll-wheel-zoom="true"
              :auto-resize="false"
              @click="handleMapClick"
              ref="baiduMapRef"
              @ready="handleMapReady"
            >
              <bm-marker
                v-if="vehicleLocation.lng && vehicleLocation.lat"
                :position="vehicleLocation"
                :dragging="true"
                @dragend="handleMarkerDragend"
              >
                <bm-label
                  :content="vehicleForm.plateNumber || '车辆位置'"
                  :offset="{ width: 0, height: -30 }"
                />
              </bm-marker>
              <template v-if="vehicleForm.route">
                <bm-polyline
                  :path="parseRoutePoints(vehicleForm.route.points)"
                  :stroke-color="'#1890ff'"
                  :stroke-weight="3"
                  :stroke-opacity="0.8"
                />
              </template>
              <bm-navigation anchor="BMAP_ANCHOR_TOP_LEFT"></bm-navigation>
              <bm-scale anchor="BMAP_ANCHOR_BOTTOM_LEFT"></bm-scale>
            </baidu-map>
            <!-- 添加定位按钮 -->
            <div class="locate-button-container">
              <a-button
                type="default"
                class="locate-button"
                :disabled="!vehicleLocation.lng && !vehicleForm.route?.points"
                @click="locateToVehicle"
              >
                <template #icon><environment-outlined /></template>
              </a-button>
            </div>
          </div>
          <div class="location-controls">
            <a-space>
              <span v-if="vehicleLocation.lng && vehicleLocation.lat">
                当前位置：经度 {{ vehicleLocation.lng.toFixed(6) }}, 纬度
                {{ vehicleLocation.lat.toFixed(6) }}
              </span>
              <a-button
                type="primary"
                size="small"
                @click="clearLocation"
                v-if="vehicleLocation.lng && vehicleLocation.lat"
              >
                清除位置
              </a-button>
              <span v-else>点击地图设置车辆位置</span>
            </a-space>
          </div>
        </a-form-item>
        <a-form-item label="备注" name="remarks">
          <a-textarea
            v-model:value="vehicleForm.remarks"
            placeholder="请输入备注信息"
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import {
  BaiduMap,
  BmMarker,
  BmNavigation,
  BmScale,
  BmLabel,
  BmPolyline,
} from "vue-baidu-map-3x";
import {
  getVehicleList,
  createvehicle,
  updatevehicle,
  deletevehicle,
  getVehicleTotalCount,
  CompleteTransport,
} from "@/api/vehicle";
import { Tag as ATag } from "ant-design-vue";

interface Point {
  lng: number;
  lat: number;
}

// 添加 RouteData 接口
interface RouteData {
  id: string;
  routeId: string;
  name: string;
  type: number;
  status: number;
  description: string;
  points: Array<{
    Type: string;
    Coordinates: [number, number];
  }>;
  distance: number;
  startOutlet: string;
  endOutlet: string;
}

// 修改 VehicleData 接口
interface VehicleData {
  id: string;
  plateNumber: string;
  type: string;
  loadCapacity: number;
  currentLoad: number;
  status: string;
  routeId?: string;
  routeName?: string;
  remarks?: string;
  lng?: string;
  lat?: string;
  createTime?: string;
  updateTime?: string;
  route?: RouteData;
  statusText?: string;
  typeText?: string;
  _originalStatus?: string;
}

// 搜索表单数据
const searchForm = reactive({
  plateNumber: "",
  type: "",
  status: "",
  routeId: "",
  routeName: "",
});

// 表格列配置
const columns = [
  {
    title: "车牌号",
    dataIndex: "plateNumber",
    key: "plateNumber",
  },
  {
    title: "车辆类型",
    dataIndex: "typeText",
    key: "type",
  },
  {
    title: "载重量(吨)",
    dataIndex: "loadCapacity",
    key: "loadCapacity",
  },
  {
    title: "当前负载(吨)",
    dataIndex: "currentLoad",
    key: "currentLoad",
  },
  {
    title: "所属线路ID",
    dataIndex: "routeId",
    key: "routeId",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
  },
  {
    title: "所属线路名称",
    dataIndex: "routeName",
    key: "routeName",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
  },
  {
    title: "状态",
    dataIndex: "statusText",
    key: "status",
    customRender: ({ record }: { record: VehicleData }) => {
      return h(
        ATag,
        { color: getStatusColor(record._originalStatus || record.status) },
        () => record.statusText || getVehicleStatusText(record.status)
      );
    },
  },
  {
    title: "备注",
    dataIndex: "remarks",
    key: "remarks",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 280,
  },
];

// 分页配置
const pagination = reactive<TablePaginationConfig>({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 车辆列表数据
const vehicleList = ref<VehicleData[]>([]);

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加车辆");
const vehicleFormRef = ref();
const vehicleForm = reactive<VehicleData>({
  id: "",
  plateNumber: "",
  type: "",
  loadCapacity: 0,
  currentLoad: 0,
  status: "空闲",
  routeId: "",
  routeName: "",
  remarks: "",
  lng: "",
  lat: "",
});

// 地图相关
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const baiduMapRef = ref(null);
const baiduMapInstance = ref<any>(null);

// 车辆位置
const vehicleLocation = reactive<Point>({ lng: 0, lat: 0 });

// 表单验证规则
const formRules = {
  plateNumber: [
    { required: true, message: "请输入车牌号" },
    {
      pattern:
        /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}$/,
      message: "请输入正确格式的车牌号，如：京A12345",
    },
  ],
  type: [{ required: true, message: "请选择车辆类型" }],
  loadCapacity: [
    { required: true, message: "请输入载重量" },
    { type: "number", min: 0.1, message: "载重量必须大于0" },
  ],
  currentLoad: [
    { required: true, message: "请输入当前负载" },
    { type: "number", min: 0, message: "当前负载不能小于0" },
  ],
  status: [{ required: true, message: "请选择车辆状态" }],
};

// 获取车辆类型文本
const getVehicleTypeText = (type: string | number) => {
  const typeStr = type?.toString() || "";
  const textMap: Record<string, string> = {
    "1": "货车",
    "2": "面包车",
    "3": "皮卡",
  };
  return textMap[typeStr] || "未知";
};

// 获取车辆状态文本
const getVehicleStatusText = (status: string | number) => {
  const statusStr = status?.toString() || "";
  const textMap: Record<string, string> = {
    "1": "运行中",
    "2": "维修中",
    "3": "空闲",
  };
  return textMap[statusStr] || "未知";
};

// 获取状态颜色
const getStatusColor = (status: string | number) => {
  const statusStr = status?.toString() || "";
  const colorMap: Record<string, string> = {
    "1": "green",
    "2": "orange",
    "3": "blue",
  };
  return colorMap[statusStr] || "default";
};

// 处理地图点击事件
const handleMapClick = (e: any) => {
  const lng = e.point.lng;
  const lat = e.point.lat;

  vehicleLocation.lng = lng;
  vehicleLocation.lat = lat;

  // 更新地图中心
  mapCenter.value = { lng, lat };

  // 将位置信息转换为JSON字符串并保存到表单
  updateLocationField();

  message.success("已设置车辆位置");
};

// 处理标记拖拽结束
const handleMarkerDragend = (e: any) => {
  const lng = e.point.lng;
  const lat = e.point.lat;

  vehicleLocation.lng = lng;
  vehicleLocation.lat = lat;

  // 将位置信息转换为JSON字符串并保存到表单
  updateLocationField();

  message.success("已更新车辆位置");
};

// 更新location字段
const updateLocationField = () => {
  if (vehicleLocation.lng !== 0 && vehicleLocation.lat !== 0) {
    vehicleForm.lng = vehicleLocation.lng.toString();
    vehicleForm.lat = vehicleLocation.lat.toString();
  } else {
    vehicleForm.lng = "";
    vehicleForm.lat = "";
  }
};

// 清除位置
const clearLocation = () => {
  vehicleLocation.lng = 0;
  vehicleLocation.lat = 0;
  vehicleForm.lng = "";
  vehicleForm.lat = "";
  message.success("已清除车辆位置");
};

// 解析位置信息
const parseLocationFromString = (lng?: string, lat?: string): Point => {
  if (!lng || !lat) {
    return { lng: 0, lat: 0 };
  }

  try {
    const lngNum = parseFloat(lng);
    const latNum = parseFloat(lat);

    if (!isNaN(lngNum) && !isNaN(latNum)) {
      return {
        lng: lngNum,
        lat: latNum,
      };
    }
  } catch (error) {
    console.error("解析位置信息失败:", error);
  }

  return { lng: 0, lat: 0 };
};

// 地图加载完成
const handleMapReady = (e: any) => {
  baiduMapInstance.value = e.map;
  // 清除之前的覆盖物
  baiduMapInstance.value.clearOverlays();

  // 如果已有线路数据，调整视图以显示整个线路
  if (
    vehicleForm.route &&
    vehicleForm.route.points &&
    vehicleForm.route.points.length > 0
  ) {
    const points = parseRoutePoints(vehicleForm.route.points);
    if (points.length > 0) {
      const bounds = new window.BMap.Bounds();
      points.forEach((point) => {
        bounds.extend(new window.BMap.Point(point.lng, point.lat));
      });
      baiduMapInstance.value.setViewport(bounds);
    }
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchVehicleList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.plateNumber = "";
  searchForm.type = "";
  searchForm.status = "";
  searchForm.routeId = "";
  searchForm.routeName = "";
  handleSearch();
};

// 表格变化处理
const handleTableChange = (pag: TablePaginationConfig) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchVehicleList();
};

// 获取车辆列表
const fetchVehicleList = async () => {
  loading.value = true;
  try {
    const params = {
      plateNumber: searchForm.plateNumber || "",
      type: searchForm.type ? Number(searchForm.type) : 0,
      status: searchForm.status ? Number(searchForm.status) : 0,
      routeId: searchForm.routeId || "",
      routeName: searchForm.routeName || "",
      page: {
        skip: pagination.current || 1,
        limit: pagination.pageSize || 10,
      },
    };

    // 并行请求列表数据和总数
    const [response, totalRes] = await Promise.all([
      getVehicleList(params),
      getVehicleTotalCount(params),
    ]);

    if (response.data.code === 0) {
      vehicleList.value = response.data.data.map((item: VehicleData) => ({
        ...item,
        statusText: getVehicleStatusText(item.status),
        typeText: getVehicleTypeText(item.type),
        _originalStatus: item.status, // 保存原始状态值用于颜色判断
      }));
      // 使用总数接口返回的数据
      if (totalRes.data.code === 0) {
        pagination.total = totalRes.data.data || 0;
      }
    } else {
      vehicleList.value = [];
      pagination.total = 0;
      message.error(response.data.message || "获取车辆列表失败");
    }
  } catch (error) {
    console.error("获取车辆列表出错:", error);
    message.error("获取车辆列表失败，请稍后重试");
    vehicleList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加车辆";
  // 重置所有表单数据
  Object.assign(vehicleForm, {
    id: "",
    plateNumber: "",
    type: "1",
    loadCapacity: 0,
    currentLoad: 0,
    status: "3",
    routeId: "",
    routeName: "",
    remarks: "",
    lng: "",
    lat: "",
    route: undefined,
  });

  // 重置位置信息
  vehicleLocation.lng = 0;
  vehicleLocation.lat = 0;

  // 设置默认地图中心
  mapCenter.value = { lng: 116.404, lat: 39.915 };

  modalVisible.value = true;
};

// 修改显示编辑弹窗函数
const showEditModal = async (record: VehicleData) => {
  modalTitle.value = "编辑车辆";

  // 先重置地图实例
  if (baiduMapInstance.value) {
    baiduMapInstance.value.clearOverlays();
  }

  // 重置所有表单数据
  Object.assign(vehicleForm, {
    id: "",
    plateNumber: "",
    type: "1",
    loadCapacity: 0,
    currentLoad: 0,
    status: "3",
    routeId: "",
    routeName: "",
    remarks: "",
    lng: "",
    lat: "",
    route: undefined,
  });

  // 设置表单数据前，先进行类型和状态的转换
  const formData = {
    ...record,
    status: record.status?.toString(), // 确保是字符串
    type: record.type?.toString(), // 确保是字符串
  };

  // 将转换后的数据设置到表单中
  Object.assign(vehicleForm, formData);

  // 解析位置信息
  const location = parseLocationFromString(record.lng, record.lat);
  vehicleLocation.lng = location.lng;
  vehicleLocation.lat = location.lat;

  // 如果有位置信息，设置地图中心
  if (location.lng !== 0 && location.lat !== 0) {
    mapCenter.value = { ...location };
  } else if (
    record.route &&
    record.route.points &&
    record.route.points.length > 0
  ) {
    // 如果没有车辆位置但有线路，使用线路的第一个点作为中心
    const firstPoint = parseRoutePoints(record.route.points)[0];
    mapCenter.value = firstPoint;
  }

  modalVisible.value = true;
};

// 处理弹窗取消
const handleModalCancel = () => {
  // 清除地图覆盖物
  if (baiduMapInstance.value) {
    baiduMapInstance.value.clearOverlays();
  }

  // 重置所有表单数据
  Object.assign(vehicleForm, {
    id: "",
    plateNumber: "",
    type: "1",
    loadCapacity: 0,
    currentLoad: 0,
    status: "3",
    routeId: "",
    routeName: "",
    remarks: "",
    lng: "",
    lat: "",
    route: undefined,
  });

  // 重置位置信息
  vehicleLocation.lng = 0;
  vehicleLocation.lat = 0;

  // 重置地图中心
  mapCenter.value = { lng: 116.404, lat: 39.915 };

  vehicleFormRef.value?.resetFields();
  modalVisible.value = false;
};

// 修改处理弹窗确认函数
const handleModalOk = () => {
  vehicleFormRef.value.validate().then(() => {
    modalLoading.value = true;

    // 构建提交数据
    const submitData = {
      ...vehicleForm,
      loadCapacity: vehicleForm.loadCapacity.toString(),
      currentLoad: vehicleForm.currentLoad.toString(),
      routeId: vehicleForm.routeId || "",
      remarks: vehicleForm.remarks || "",
      lng: vehicleForm.lng || "",
      lat: vehicleForm.lat || "",
    };

    // 根据是新增还是编辑调用不同API
    const apiCall = vehicleForm.id
      ? updatevehicle(submitData)
      : createvehicle(submitData);

    apiCall
      .then(async (res: any) => {
        message.success(res.message || "操作成功");
        modalVisible.value = false;

        // 清除地图覆盖物
        if (baiduMapInstance.value) {
          baiduMapInstance.value.clearOverlays();
        }

        // 重置表单数据
        Object.assign(vehicleForm, {
          id: "",
          plateNumber: "",
          type: "1",
          loadCapacity: 0,
          currentLoad: 0,
          status: "3",
          routeId: "",
          routeName: "",
          remarks: "",
          lng: "",
          lat: "",
          route: undefined,
        });
        // 重置位置信息
        vehicleLocation.lng = 0;
        vehicleLocation.lat = 0;
        fetchVehicleList(); // 刷新列表
      })
      .catch((err: any) => {
        console.error("操作失败:", err);
        message.error(err.message || "操作失败");
      })
      .finally(() => {
        modalLoading.value = false;
      });
  });
};

// 处理删除
const handleDelete = (record: VehicleData) => {
  deletevehicle(record.plateNumber)
    .then((res: any) => {
      message.success(res.message || "删除成功");
      fetchVehicleList(); // 刷新列表
    })
    .catch((err: any) => {
      console.error("删除失败:", err);
      message.error(err.message || "删除失败");
    });
};

// 定位到车辆位置
const locateToVehicle = () => {
  const points: Point[] = [];

  // 添加车辆位置
  if (vehicleLocation.lng && vehicleLocation.lat) {
    points.push({
      lng: vehicleLocation.lng,
      lat: vehicleLocation.lat,
    });
  }

  // 添加线路点位
  if (vehicleForm.route && vehicleForm.route.points) {
    const routePoints = parseRoutePoints(vehicleForm.route.points);
    points.push(...routePoints);
  }

  // 如果有点位，调整地图视图
  if (points.length > 0) {
    const bounds = new window.BMap.Bounds();
    points.forEach((point) => {
      bounds.extend(new window.BMap.Point(point.lng, point.lat));
    });

    if (baiduMapInstance.value) {
      baiduMapInstance.value.setViewport(bounds, {
        margins: [50, 50, 50, 50], // 设置边距
        zoomFactor: -1, // 自动调整缩放级别
      });
    }
  } else {
    message.info("没有可显示的位置信息");
  }
};

// 添加解析线路点位的函数
const parseRoutePoints = (
  points: Array<{ Type: string; Coordinates: [number, number] }>
): Point[] => {
  return points.map((point) => ({
    lng: point.Coordinates[0],
    lat: point.Coordinates[1],
  }));
};

// 添加完成运输的处理函数
const handleCompleteTransport = async (record: VehicleData) => {
  try {
    const res = await CompleteTransport(record.plateNumber);
    if (res.data.code === 0) {
      message.success("运输任务已完成");
      fetchVehicleList(); // 刷新列表
    } else {
      message.error(res.data.message || "操作失败");
    }
  } catch (error) {
    console.error("完成运输失败:", error);
    message.error("完成运输失败，请稍后重试");
  }
};

// 在组件初始化时获取数据
onMounted(() => {
  fetchVehicleList();
});
</script>

<style scoped>
.vehicle-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.search-card {
  margin-bottom: 24px;
}

.table-operations {
  margin-bottom: 16px;
}

.unit {
  margin-left: 8px;
}

.danger-text {
  color: #ff4d4f;
}

.map-container {
  height: 300px;
  margin-bottom: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.map {
  height: 100%;
  width: 100%;
}

.location-controls {
  margin-top: 8px;
  margin-bottom: 16px;
}

.locate-button-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.locate-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.locate-button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.locate-button:disabled {
  color: rgba(0, 0, 0, 0.25);
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}

:deep(.ant-table-cell .ant-space) {
  white-space: nowrap;
  display: flex;
  align-items: center;
}

:deep(.ant-table-cell .ant-space-item) {
  display: inline-flex;
  align-items: center;
  margin-right: 0;
}

:deep(.ant-table-cell .ant-divider-vertical) {
  margin: 0 8px;
  height: 12px;
}

:deep(.ant-table-cell .ant-popconfirm) {
  display: inline-block;
}
</style>
