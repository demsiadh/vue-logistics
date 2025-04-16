<template>
  <div class="route-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="线路ID">
          <a-input
            v-model:value="searchForm.routeId"
            placeholder="请输入线路ID"
          />
        </a-form-item>
        <a-form-item label="线路名称">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入线路名称"
          />
        </a-form-item>
        <a-form-item label="线路类型">
          <a-select v-model:value="searchForm.type" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">常规线路</a-select-option>
            <a-select-option value="2">快速线路</a-select-option>
            <a-select-option value="3">特殊线路</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="线路状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
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
        添加线路
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="routeList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'type'">
          {{ getRouteTypeText(record.type) }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除这条线路吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑线路弹窗 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
      width="800px"
    >
      <a-form
        :model="routeForm"
        :rules="formRules"
        ref="routeFormRef"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 19 }"
      >
        <a-form-item
          v-if="modalTitle === '编辑线路'"
          label="线路ID"
          name="routeId"
        >
          <a-input
            v-model:value="routeForm.routeId"
            placeholder="请输入线路ID"
            disabled
          />
        </a-form-item>
        <a-form-item label="线路名称" name="name">
          <a-input v-model:value="routeForm.name" />
        </a-form-item>
        <a-form-item label="线路类型" name="type">
          <a-select v-model:value="routeForm.type">
            <a-select-option value="1">常规线路</a-select-option>
            <a-select-option value="2">快速线路</a-select-option>
            <a-select-option value="3">特殊线路</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="线路状态" name="status">
          <a-select v-model:value="routeForm.status">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="线路描述" name="description">
          <a-textarea v-model:value="routeForm.description" :rows="3" />
        </a-form-item>
        <a-form-item label="线路里程" name="distance">
          <a-input
            :value="routeForm.distance ? routeForm.distance.toFixed(2) : '0.00'"
            disabled
            addon-after="公里"
            :style="{ width: '200px' }"
          />
          <span style="margin-left: 8px; color: #999"
            >（路线里程由系统自动计算）</span
          >
        </a-form-item>
        <a-form-item label="线路点" name="points">
          <div class="map-container">
            <baidu-map
              class="map"
              :center="mapCenter"
              :zoom="mapZoom"
              :scroll-wheel-zoom="true"
              @click="handleMapClick"
            >
              <bm-polyline
                v-if="routeForm.points.length > 0"
                :path="routeForm.points"
                stroke-color="#3388ff"
                :stroke-opacity="0.8"
                :stroke-weight="5"
                :editing="true"
                @lineupdate="handleLineUpdate"
              ></bm-polyline>
              <bm-marker
                v-for="(point, index) in routeForm.points"
                :key="index"
                :position="point"
                :dragging="true"
                @dragend="handleMarkerDragend($event, index)"
              >
                <bm-label
                  :content="(index + 1).toString()"
                  :offset="{ width: 0, height: -30 }"
                />
              </bm-marker>
              <bm-navigation anchor="BMAP_ANCHOR_TOP_LEFT"></bm-navigation>
              <bm-scale anchor="BMAP_ANCHOR_BOTTOM_LEFT"></bm-scale>
            </baidu-map>
          </div>
          <div class="map-tools">
            <a-button
              type="primary"
              @click="addPoint"
              :disabled="isAddingPoint"
            >
              {{ isAddingPoint ? "正在添加中..." : "添加线路点" }}
            </a-button>
            <a-button
              type="danger"
              @click="exitAddingMode"
              :disabled="!isAddingPoint"
            >
              退出添加
            </a-button>
            <a-button
              @click="clearPoints"
              :disabled="routeForm.points.length === 0"
            >
              清空线路点
            </a-button>
            <a-button
              @click="sortRoutePoints"
              :disabled="routeForm.points.length < 2"
            >
              确认线路
            </a-button>
            <a-button
              @click="togglePointsList"
              :disabled="routeForm.points.length === 0"
            >
              {{ showPointsList ? "收起线路点列表" : "展开线路点列表" }}
            </a-button>
          </div>
          <div
            class="points-list"
            v-if="routeForm.points.length > 0 && showPointsList"
          >
            <div class="points-header">
              <span>线路点列表</span>
              <a-button type="link" @click="showPointsModal">查看详情</a-button>
            </div>
            <a-table
              :columns="pointColumns"
              :data-source="routeForm.points"
              :pagination="false"
              size="small"
              rowKey="id"
            >
              <template #bodyCell="{ column, index }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="movePoint(index, 'up')" :disabled="index === 0"
                      >上移</a
                    >
                    <a
                      @click="movePoint(index, 'down')"
                      :disabled="index === routeForm.points.length - 1"
                      >下移</a
                    >
                    <a class="danger-text" @click="removePoint(index)">删除</a>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 线路点详情弹窗 -->
    <a-modal
      title="线路点详情"
      v-model:visible="pointsModalVisible"
      :footer="null"
      width="600px"
    >
      <a-table
        :columns="pointColumns"
        :data-source="routeForm.points"
        :pagination="false"
        rowKey="id"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="movePoint(index, 'up')" :disabled="index === 0"
                >上移</a
              >
              <a
                @click="movePoint(index, 'down')"
                :disabled="index === routeForm.points.length - 1"
                >下移</a
              >
              <a class="danger-text" @click="removePoint(index)">删除</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import {
  BaiduMap,
  BmMarker,
  BmPolyline,
  BmNavigation,
  BmScale,
  BmLabel,
} from "vue-baidu-map-3x";
import {
  getRouteList,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteTotalCount,
} from "@/api/route";

interface Point {
  lng: number;
  lat: number;
  id?: string;
}

interface GeoPoint {
  type: string;
  coordinates: number[];
}

interface Route {
  id: string;
  routeId: string;
  name: string;
  type: string | number;
  status: string;
  description: string;
  points: Point[];
  distance: number; // 线路里程，单位公里
}

// 搜索表单数据
const searchForm = reactive({
  routeId: "",
  name: "",
  type: "" as string | number,
  status: "",
});

// 表格列配置
const columns = [
  {
    title: "线路ID",
    dataIndex: "routeId",
    key: "routeId",
    width: 120,
    align: "center",
  },
  {
    title: "线路名称",
    dataIndex: "name",
    key: "name",
    width: 150,
    ellipsis: true,
  },
  {
    title: "线路类型",
    dataIndex: "type",
    key: "type",
    width: 120,
    align: "center",
  },
  {
    title: "线路状态",
    dataIndex: "status",
    key: "status",
    width: 100,
    align: "center",
  },
  {
    title: "线路里程(km)",
    dataIndex: "distance",
    key: "distance",
    width: 120,
    align: "right",
    customRender: ({ record }: { record: Route }) => {
      return record.distance ? record.distance.toFixed(2) : "0.00";
    },
  },
  {
    title: "线路描述",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    width: 200,
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 150,
    align: "center",
  },
];

// 修改线路点表格列，移除到下一点距离列
const pointColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    customRender: ({ index }: { index: number }) => index + 1,
  },
  {
    title: "经度",
    dataIndex: "lng",
    key: "lng",
    customRender: ({ text }: { text: number }) => text.toFixed(6),
  },
  {
    title: "纬度",
    dataIndex: "lat",
    key: "lat",
    customRender: ({ text }: { text: number }) => text.toFixed(6),
  },
  {
    title: "操作",
    key: "action",
    width: 250,
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

// 线路列表数据
const routeList = ref<Route[]>([]);

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加线路");
const routeFormRef = ref();
const routeForm = reactive<Route>({
  id: "",
  routeId: "",
  name: "",
  type: "1",
  status: "active",
  description: "",
  points: [],
  distance: 0, // 初始化里程为0
});

// 地图相关
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const isAddingPoint = ref(false);

// 线路点详情弹窗
const pointsModalVisible = ref(false);

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入线路名称" }],
  type: [{ required: true, message: "请选择线路类型" }],
  status: [{ required: true, message: "请选择线路状态" }],
  points: [{ required: true, message: "请添加至少一个线路点" }],
};

// 获取状态颜色
const getStatusColor = (status: string | number) => {
  const colorMap: Record<string | number, string> = {
    1: "green",
    2: "red",
    active: "green",
    inactive: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: string | number) => {
  const textMap: Record<string | number, string> = {
    1: "启用",
    2: "禁用",
    active: "启用",
    inactive: "禁用",
  };
  return textMap[status] || "未知";
};

// 获取线路类型文本
const getRouteTypeText = (type: string | number) => {
  const textMap: Record<string | number, string> = {
    1: "常规线路",
    2: "快速线路",
    3: "特殊线路",
  };
  return textMap[type] || "未知";
};

// 将API返回的数字类型转为前端数字类型(无需转换)
const mapTypeNumberToString = (typeNum: number): string => {
  return typeNum.toString();
};

// 将前端数字类型转为API需要的数字类型
const mapTypeStringToNumber = (typeStr: number | string): number => {
  if (typeof typeStr === "string" && typeStr !== "") {
    return parseInt(typeStr, 10);
  }
  return typeof typeStr === "number" ? typeStr : 1;
};

// 将API返回的数字状态转为前端字符串状态
const mapStatusNumberToString = (statusNum: number): string => {
  return statusNum === 1 ? "active" : "inactive";
};

// 将前端字符串状态转为API需要的数字状态
const mapStatusStringToNumber = (statusStr: string): number => {
  return statusStr === "active" ? 1 : 2;
};

// 将GeoPoint数组转换为Point数组
const geoPointsToPoints = (geoPoints: any[]): Point[] => {
  return geoPoints.map((p, index) => ({
    id: `point-${index + 1}`,
    lng: p.Coordinates[0],
    lat: p.Coordinates[1],
  }));
};

// 将Point数组转换为GeoPoint数组
const pointsToGeoPoints = (points: Point[]): string => {
  const geoPoints = points.map((p) => ({
    Type: "Point",
    Coordinates: [p.lng, p.lat],
  }));
  return JSON.stringify(geoPoints, null, 4);
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchRouteList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.routeId = "";
  searchForm.name = "";
  searchForm.type = "";
  searchForm.status = "";
  handleSearch();
};

// 获取线路列表数据
const fetchRouteList = async () => {
  loading.value = true;
  try {
    const typeNum = searchForm.type
      ? mapTypeStringToNumber(searchForm.type)
      : 0;
    const statusNum = searchForm.status
      ? mapStatusStringToNumber(searchForm.status)
      : 0;
    const response = await getRouteList({
      routeId: searchForm.routeId || "",
      name: searchForm.name || "",
      type: typeNum,
      status: statusNum,
      skip: pagination.current || 1,
      limit: pagination.pageSize || 10,
    });

    if (response.data.code === 0) {
      const routes = response.data.data;
      if (routes !== null && Array.isArray(routes)) {
        // 转换格式
        routeList.value = routes.map((route: any) => ({
          id: route.id,
          routeId: route.routeId,
          name: route.name,
          type: mapTypeNumberToString(route.type),
          status: mapStatusNumberToString(route.status),
          description: route.description || "",
          points: geoPointsToPoints(route.points || []),
          distance: route.distance || 0,
        }));

        // 使用数据长度作为总数
        pagination.total = routes.length;
      } else {
        routeList.value = [];
        pagination.total = 0;
      }
    } else {
      message.error("获取线路列表失败");
      routeList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error("获取线路列表出错:", error);
    message.error("获取线路列表失败，请稍后重试");
    routeList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 表格变化处理
const handleTableChange = (pag: TablePaginationConfig) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchRouteList();
};

// 添加控制线路点列表显示的状态变量
const showPointsList = ref(false);

// 切换线路点列表显示状态
const togglePointsList = () => {
  showPointsList.value = !showPointsList.value;
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加线路";
  routeForm.id = "";
  routeForm.routeId = "";
  routeForm.name = "";
  routeForm.type = "1";
  routeForm.status = "active";
  routeForm.description = "";
  routeForm.points = [];
  routeForm.distance = 0;
  showPointsList.value = false; // 重置列表显示状态
  isAddingPoint.value = false; // 确保不在添加点模式
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Route) => {
  modalTitle.value = "编辑线路";
  // 直接使用从列表获取的数据
  Object.assign(routeForm, {
    id: record.id,
    routeId: record.routeId,
    name: record.name,
    type: record.type.toString(), // 确保类型是字符串
    status: record.status === "active" ? "active" : "inactive", // 保持字符串状态
    description: record.description,
    points: record.points,
    distance: record.distance,
  });
  showPointsList.value = false; // 重置列表显示状态
  modalVisible.value = true;

  // 计算线路中心点作为地图中心
  if (routeForm.points && routeForm.points.length > 0) {
    const lngSum = routeForm.points.reduce(
      (sum: number, point: Point) => sum + point.lng,
      0
    );
    const latSum = routeForm.points.reduce(
      (sum: number, point: Point) => sum + point.lat,
      0
    );
    const count = routeForm.points.length;

    mapCenter.value = {
      lng: lngSum / count,
      lat: latSum / count,
    };
  }
};

// 显示线路点详情弹窗
const showPointsModal = () => {
  pointsModalVisible.value = true;
};

// 修改处理地图点击事件
const handleMapClick = (e: any) => {
  console.log("地图点击事件:", e);
  if (isAddingPoint.value) {
    const lng = e.point ? e.point.lng : e.latlng ? e.latlng.lng : null;
    const lat = e.point ? e.point.lat : e.latlng ? e.latlng.lat : null;

    if (lng !== null && lat !== null) {
      const point = {
        lng: lng,
        lat: lat,
        id: `point-${Date.now()}`,
      };
      routeForm.points.push(point);
      message.success(
        `已添加第 ${routeForm.points.length} 个点，点击地图继续添加点`
      );
      // 添加点后计算距离
      calculateDistance();
    } else {
      message.error("获取坐标失败，请重试");
    }
  }
};

// 修改清空线路点
const clearPoints = () => {
  routeForm.points = [];
  routeForm.distance = 0; // 清空距离
};

// 修改移除线路点
const removePoint = (index: number) => {
  routeForm.points.splice(index, 1);
  // 移除点后计算距离
  calculateDistance();
};

// 修改移动线路点
const movePoint = (index: number, direction: "up" | "down") => {
  if (direction === "up" && index > 0) {
    const temp = routeForm.points[index];
    routeForm.points[index] = routeForm.points[index - 1];
    routeForm.points[index - 1] = temp;
    // 移动点后计算距离
    calculateDistance();
  } else if (direction === "down" && index < routeForm.points.length - 1) {
    const temp = routeForm.points[index];
    routeForm.points[index] = routeForm.points[index + 1];
    routeForm.points[index + 1] = temp;
    // 移动点后计算距离
    calculateDistance();
  }
};

// 修改处理标记拖拽结束
const handleMarkerDragend = (e: any, index: number) => {
  const newPoint = {
    lng: e.point.lng,
    lat: e.point.lat,
    id: routeForm.points[index].id,
  };
  routeForm.points.splice(index, 1, newPoint);
  // 拖拽结束后计算距离
  calculateDistance();
};

// 修改处理线路更新
const handleLineUpdate = (e: any) => {
  if (e.target && e.target.getPath) {
    const path = e.target.getPath();
    routeForm.points = path.map((point: any, index: number) => ({
      lng: point.lng,
      lat: point.lat,
      id: routeForm.points[index]?.id || `point-${Date.now()}-${index}`,
    }));
    // 线路更新后计算距离
    calculateDistance();
  }
};

// 添加计算距离的通用方法
const calculateDistance = () => {
  if (routeForm.points.length < 2) {
    routeForm.distance = 0;
    return;
  }

  // 计算线路总距离（使用简单的球面距离公式）
  let totalDistance = 0;
  for (let i = 0; i < routeForm.points.length - 1; i++) {
    const point1 = routeForm.points[i];
    const point2 = routeForm.points[i + 1];

    // 将经纬度转换为弧度
    const rad = (d: number) => (d * Math.PI) / 180;
    const lat1 = rad(point1.lat);
    const lat2 = rad(point2.lat);
    const deltaLat = rad(point2.lat - point1.lat);
    const deltaLng = rad(point2.lng - point1.lng);

    // 使用Haversine公式计算距离
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // 地球半径6371km

    totalDistance += distance;
  }

  routeForm.distance = totalDistance;
};

// 修改确认线路方法
const sortRoutePoints = () => {
  if (routeForm.points.length < 2) {
    message.warning("至少需要两个点才能形成线路");
    return;
  }

  calculateDistance();
  message.success(`线路已确认，总里程：${routeForm.distance.toFixed(2)}公里`);
};

// 添加线路点
const addPoint = () => {
  isAddingPoint.value = true;
  message.info("已进入连续添加模式：点击地图添加线路点，点击退出添加按钮结束");
};

// 退出添加模式
const exitAddingMode = () => {
  if (isAddingPoint.value) {
    isAddingPoint.value = false;
    message.success(`退出添加模式，已添加 ${routeForm.points.length} 个点`);
  }
};

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    await routeFormRef.value.validate();
    modalLoading.value = true;

    // 构建提交数据
    const submitData = {
      name: routeForm.name,
      type: mapTypeStringToNumber(routeForm.type),
      status: mapStatusStringToNumber(routeForm.status),
      description: routeForm.description,
      points: JSON.stringify(
        routeForm.points.map((point) => ({
          type: "Point",
          coordinates: [point.lng, point.lat],
        }))
      ),
      distance: routeForm.distance,
    };
    let response;
    if (modalTitle.value === "添加线路") {
      // 创建新线路
      response = await createRoute(submitData);
    } else {
      // 更新现有线路
      response = await updateRoute({
        ...submitData,
        routeId: routeForm.routeId,
      });
    }

    if (response.data.code === 0) {
      message.success(`${modalTitle.value}成功`);
      modalVisible.value = false;
      fetchRouteList();
    } else {
      message.error(response.data?.msg || `${modalTitle.value}失败`);
    }
  } catch (error) {
    console.error(`${modalTitle.value}出错:`, error);
    message.error(`${modalTitle.value}失败，请稍后重试`);
  } finally {
    modalLoading.value = false;
  }
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = async (record: Route) => {
  try {
    const response = await deleteRoute(record.routeId);

    if (response.data.code === 0) {
      message.success("删除成功");
      fetchRouteList();
    } else {
      message.error(response.data?.message || "删除失败");
    }
  } catch (error) {
    console.error("删除线路出错:", error);
    message.error("删除失败，请稍后重试");
  }
};

// 初始化
onMounted(() => {
  fetchRouteList();
});
</script>

<style scoped>
.route-container {
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

.map-container {
  height: 300px;
  margin-bottom: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.map {
  height: 100%;
  width: 100%;
}

.map-tools {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.points-list {
  margin-top: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 2px;
}

.points-header {
  padding: 8px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-text {
  color: #ff4d4f;
}

:deep(.ant-form-inline .ant-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

:deep(.ant-table) {
  background: #fff;
  padding: 24px;
  border-radius: 2px;
}
</style>
