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
        <a-form-item label="起始网点" name="startOutlet">
          <a-select
            v-model:value="routeForm.startOutletId"
            placeholder="请选择起始网点"
            @change="handleStartOutletChange"
            allowClear
          >
            <a-select-option
              v-for="outlet in outletList"
              :key="outlet.id"
              :value="outlet.id"
            >
              {{ outlet.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="终点网点" name="endOutlet">
          <a-select
            v-model:value="routeForm.endOutletId"
            placeholder="请选择终点网点"
            @change="handleEndOutletChange"
            allowClear
          >
            <a-select-option
              v-for="outlet in outletList"
              :key="outlet.id"
              :value="outlet.id"
            >
              {{ outlet.name }}
            </a-select-option>
          </a-select>
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
              ref="baiduMapRef"
              @ready="handleMapReady"
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

              <!-- 添加总览按钮 -->
              <div class="locate-button-container">
                <a-button
                  type="default"
                  class="locate-button"
                  :disabled="routeForm.points.length < 2"
                  @click="viewAllPoints"
                >
                  <template #icon><EnvironmentOutlined /></template>
                </a-button>
              </div>
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
              type="primary"
              @click="generateRoutePoints"
              :disabled="!canGenerateRoute"
            >
              <template #icon><EnvironmentOutlined /></template>
              自动生成线路
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
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons-vue";
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
import { getOutletList } from "@/api/outlet";

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
  startOutlet?: any; // 起始网点
  endOutlet?: any; // 终点网点
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
    width: 160,
    align: "center",
  },
  {
    title: "线路名称",
    dataIndex: "name",
    key: "name",
    width: 180,
    ellipsis: true,
  },
  {
    title: "起始网点",
    dataIndex: "startOutlet",
    key: "startOutlet",
    width: 160,
    ellipsis: true,
    customRender: ({ record }: { record: Route }) => {
      return record.startOutlet ? record.startOutlet.name : "无";
    },
  },
  {
    title: "终点网点",
    dataIndex: "endOutlet",
    key: "endOutlet",
    width: 160,
    ellipsis: true,
    customRender: ({ record }: { record: Route }) => {
      return record.endOutlet ? record.endOutlet.name : "无";
    },
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
    width: 130,
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
    width: 220,
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 160,
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
const routeForm = reactive<
  Route & { startOutletId?: string; endOutletId?: string }
>({
  id: "",
  routeId: "",
  name: "",
  type: "1",
  status: "active",
  description: "",
  points: [],
  distance: 0,
  startOutlet: null,
  endOutlet: null,
  startOutletId: undefined,
  endOutletId: undefined,
});

// 地图相关
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const isAddingPoint = ref(false);

// 线路点详情弹窗
const pointsModalVisible = ref(false);

// 网点列表数据
const outletList = ref<any[]>([]);
const outletOptions = ref<{ label: string; value: string }[]>([]);

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入线路名称" }],
  type: [{ required: true, message: "请选择线路类型" }],
  status: [{ required: true, message: "请选择线路状态" }],
  points: [{ required: true, message: "请添加至少一个线路点" }],
  startOutlet: [{ required: true, message: "请选择起始网点" }],
  endOutlet: [{ required: true, message: "请选择终点网点" }],
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

    // 构建查询参数
    const queryParams = {
      routeId: searchForm.routeId || "",
      name: searchForm.name || "",
      type: typeNum,
      status: statusNum,
      page: {
        skip: pagination.current || 1,
        limit: pagination.pageSize || 10,
      },
    };

    // 并行请求列表数据和总数
    const [response, totalRes] = await Promise.all([
      getRouteList(queryParams),
      getRouteTotalCount(queryParams),
    ]);

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
          startOutlet: route.startOutlet || null, // 路线起始网点
          endOutlet: route.endOutlet || null, // 路线终点网点
        }));

        // 使用总数接口返回的数据
        if (totalRes.data.code === 0) {
          pagination.total = totalRes.data.data || 0;
        }
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
  routeForm.startOutlet = null;
  routeForm.endOutlet = null;
  routeForm.startOutletId = undefined;
  routeForm.endOutletId = undefined;
  showPointsList.value = false;
  isAddingPoint.value = false;

  // 设置合理的初始地图中心和缩放级别
  // 如果有网点数据，尝试使用网点数据的平均位置作为地图中心
  if (outletList.value && outletList.value.length > 0) {
    // 收集所有有效的网点坐标
    const validOutlets = outletList.value.filter(
      (outlet) => outlet.lng && outlet.lat
    );

    if (validOutlets.length > 0) {
      // 计算平均经纬度作为中心点
      const center = validOutlets.reduce(
        (acc, outlet) => {
          if (outlet.lng && outlet.lat) {
            acc.lng += parseFloat(outlet.lng);
            acc.lat += parseFloat(outlet.lat);
            acc.count += 1;
          }
          return acc;
        },
        { lng: 0, lat: 0, count: 0 }
      );

      if (center.count > 0) {
        mapCenter.value = {
          lng: center.lng / center.count,
          lat: center.lat / center.count,
        };
        mapZoom.value = 10; // 设置一个合适的缩放级别
      }
    }
  }

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
    startOutlet: record.startOutlet,
    endOutlet: record.endOutlet,
    startOutletId: record.startOutlet?.id,
    endOutletId: record.endOutlet?.id,
  });
  showPointsList.value = false; // 重置列表显示状态
  modalVisible.value = true;

  // 计算线路中心点作为地图中心
  updateMapCenter();

  // 等待DOM更新和地图加载完成后，自动触发总览全图
  nextTick(() => {
    // 使用setTimeout确保地图实例已初始化
    setTimeout(() => {
      if (routeForm.points.length >= 2) {
        viewAllPoints();
      }
    }, 500);
  });
};

// 显示线路点详情弹窗
const showPointsModal = () => {
  pointsModalVisible.value = true;
};

// 修改处理地图点击事件，在起点和终点之间添加点
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

      // 检查是否已经设置了起点和终点
      const hasStartAndEnd =
        routeForm.startOutletId &&
        routeForm.endOutletId &&
        routeForm.points.length >= 2;

      if (hasStartAndEnd) {
        // 如果已设置起点和终点，则在倒数第二个位置（终点前面）插入新点
        const updatedPoints = [...routeForm.points];
        updatedPoints.splice(updatedPoints.length - 1, 0, point);
        routeForm.points = updatedPoints;
        message.success(
          `已在终点前添加中间点，当前共有 ${routeForm.points.length} 个点`
        );
      } else {
        // 如果没有同时设置起点和终点，则正常添加到末尾
        routeForm.points.push(point);
        message.success(
          `已添加第 ${routeForm.points.length} 个点，点击地图继续添加点`
        );
      }

      // 添加点后计算距离
      calculateDistance();
    } else {
      message.error("获取坐标失败，请重试");
    }
  }
};

// 修改清空线路点方法，同时清空起点和终点
const clearPoints = () => {
  routeForm.points = [];
  routeForm.distance = 0;

  // 同时清空起点和终点
  routeForm.startOutlet = null;
  routeForm.endOutlet = null;
  routeForm.startOutletId = undefined;
  routeForm.endOutletId = undefined;

  message.success("已清空线路点及起终点设置");
};

// 修改移除线路点，防止移除起点和终点
const removePoint = (index: number) => {
  // 如果已设置起点和终点，且尝试删除的是起点或终点，则阻止操作
  if (routeForm.startOutletId && routeForm.endOutletId) {
    if (index === 0 || index === routeForm.points.length - 1) {
      message.warning("不能删除起点或终点，如需修改请重新选择网点");
      return;
    }
  }

  routeForm.points.splice(index, 1);
  // 移除点后计算距离
  calculateDistance();
};

// 修改移动线路点，确保不能移动起点和终点的位置
const movePoint = (index: number, direction: "up" | "down") => {
  // 如果已设置起点和终点，阻止移动起点或终点
  if (routeForm.startOutletId && routeForm.endOutletId) {
    if (index === 0 || index === routeForm.points.length - 1) {
      message.warning("不能移动起点或终点的位置");
      return;
    }

    // 阻止将中间点移到起点或终点的位置
    if (
      (direction === "up" && index === 1) ||
      (direction === "down" && index === routeForm.points.length - 2)
    ) {
      message.warning("中间点不能与起点或终点交换位置");
      return;
    }
  }

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

// 修改处理标记拖拽结束，禁止拖动起点和终点
const handleMarkerDragend = (e: any, index: number) => {
  // 如果已设置起点和终点，且尝试拖动的是起点或终点，则阻止操作
  if (routeForm.startOutletId && routeForm.endOutletId) {
    if (index === 0 || index === routeForm.points.length - 1) {
      message.warning("不能拖动起点或终点，如需修改请重新选择网点");
      return;
    }
  }

  const newPoint = {
    lng: e.point.lng,
    lat: e.point.lat,
    id: routeForm.points[index].id,
  };
  routeForm.points.splice(index, 1, newPoint);
  // 拖拽结束后计算距离
  calculateDistance();
};

// 修改处理线路更新，确保起点和终点的位置不变
const handleLineUpdate = (e: any) => {
  if (e.target && e.target.getPath) {
    const path = e.target.getPath();

    // 如果已设置起点和终点，确保它们的位置不变
    if (
      routeForm.startOutletId &&
      routeForm.endOutletId &&
      routeForm.points.length >= 2
    ) {
      const startPoint = routeForm.points[0];
      const endPoint = routeForm.points[routeForm.points.length - 1];

      // 只更新中间点
      const middlePoints = path
        .slice(1, path.length - 1)
        .map((point: any, index: number) => ({
          lng: point.lng,
          lat: point.lat,
          id:
            routeForm.points[index + 1]?.id ||
            `point-${Date.now()}-${index + 1}`,
        }));

      routeForm.points = [startPoint, ...middlePoints, endPoint];
    } else {
      // 如果没有设置起点和终点，则正常更新所有点
      routeForm.points = path.map((point: any, index: number) => ({
        lng: point.lng,
        lat: point.lat,
        id: routeForm.points[index]?.id || `point-${Date.now()}-${index}`,
      }));
    }

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

// 修改确认线路方法，确保起点和终点的位置固定
const sortRoutePoints = () => {
  if (routeForm.points.length < 2) {
    message.warning("至少需要两个点才能形成线路");
    return;
  }

  // 如果已设置起点和终点，确保它们保持在首尾位置
  if (routeForm.startOutletId && routeForm.endOutletId) {
    const startPoint = routeForm.points[0];
    const endPoint = routeForm.points[routeForm.points.length - 1];

    // 重新排序中间点（可以根据需要实现排序逻辑）
    let middlePoints = routeForm.points.slice(1, routeForm.points.length - 1);

    // 这里只是示例，可以根据需要实现更复杂的排序逻辑
    // 例如按照距离起点的远近排序等

    // 合并回起点和终点
    routeForm.points = [startPoint, ...middlePoints, endPoint];

    message.success("线路已确认，起点和终点保持不变");
  }

  calculateDistance();
  message.success(`线路已确认，总里程：${routeForm.distance.toFixed(2)}公里`);
};

// 添加一个判断是否可以添加中间点的计算属性
const canAddMiddlePoints = computed(() => {
  return (
    routeForm.startOutletId &&
    routeForm.endOutletId &&
    routeForm.points.length >= 2
  );
});

// 添加点的提示信息修改
const addPoint = () => {
  isAddingPoint.value = true;
  if (canAddMiddlePoints.value) {
    message.info(
      "已进入连续添加模式：点击地图添加中间点，新点将添加在起点和终点之间"
    );
  } else {
    message.info(
      "已进入连续添加模式：点击地图添加线路点，点击退出添加按钮结束"
    );
  }
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
      startOutlet: routeForm.startOutletId || "", // 使用正确的字段名 startOutlet，值从startOutletId中获取
      endOutlet: routeForm.endOutletId || "", // 使用正确的字段名 endOutlet，值从endOutletId中获取
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

// 获取网点列表用于下拉选择
const fetchOutletOptions = async () => {
  try {
    const response = await getOutletList({
      name: "",
      status: 1, // 只获取启用状态的网点
      province: "",
      city: "",
      skip: 0,
      limit: 100, // 获取足够多的网点数据
    });

    if (response.data.code === 0 && Array.isArray(response.data.data)) {
      outletList.value = response.data.data;
      outletOptions.value = response.data.data.map((outlet: any) => ({
        label: outlet.name,
        value: outlet.id,
      }));
    }
  } catch (error) {
    console.error("获取网点列表失败:", error);
    message.error("获取网点列表失败");
  }
};

// 修改处理终点网点变更的函数，确保不覆盖起点
const handleEndOutletChange = (outletId: string) => {
  if (!outletId) {
    routeForm.endOutlet = null;
    routeForm.endOutletId = undefined;
    return;
  }

  const selectedOutlet = outletList.value.find(
    (outlet) => outlet.id === outletId
  );
  if (selectedOutlet) {
    routeForm.endOutlet = selectedOutlet;
    routeForm.endOutletId = outletId;

    // 如果网点有经纬度坐标，添加到线路点中作为终点
    if (selectedOutlet.lng && selectedOutlet.lat) {
      const endPoint = {
        lng: parseFloat(selectedOutlet.lng),
        lat: parseFloat(selectedOutlet.lat),
        id: `point-end-${Date.now()}`,
      };

      // 检查线路点的数量
      if (routeForm.points.length === 0) {
        // 如果没有点，直接添加终点
        routeForm.points.push(endPoint);
        message.success("已将终点网点位置添加为线路终点");
      } else if (routeForm.points.length === 1) {
        // 如果只有一个点（起点），则添加终点作为第二个点
        routeForm.points.push(endPoint);
        message.success("已将终点网点位置设置为线路终点");
      } else {
        // 如果有多个点，替换最后一个点为终点
        routeForm.points[routeForm.points.length - 1] = endPoint;
        message.success("已将终点网点位置设置为线路终点");
      }

      // 重新计算线路距离
      calculateDistance();

      // 更新地图中心点
      updateMapCenter();
    }
  }
};

// 修改处理起点网点变更的函数，确保不覆盖终点
const handleStartOutletChange = (outletId: string) => {
  if (!outletId) {
    routeForm.startOutlet = null;
    routeForm.startOutletId = undefined;
    return;
  }

  const selectedOutlet = outletList.value.find(
    (outlet) => outlet.id === outletId
  );
  if (selectedOutlet) {
    routeForm.startOutlet = selectedOutlet;
    routeForm.startOutletId = outletId;

    // 如果网点有经纬度坐标，添加到线路点中作为起点
    if (selectedOutlet.lng && selectedOutlet.lat) {
      const startPoint = {
        lng: parseFloat(selectedOutlet.lng),
        lat: parseFloat(selectedOutlet.lat),
        id: `point-start-${Date.now()}`,
      };

      // 检查是否已有起点
      if (routeForm.points.length === 0) {
        // 如果没有点，直接添加起点
        routeForm.points.push(startPoint);
        message.success("已将起始网点位置添加为线路起点");
      } else {
        // 如果已经有点，将第一个点替换为起点，保留其他点
        const updatedPoints = [...routeForm.points];
        updatedPoints[0] = startPoint;
        routeForm.points = updatedPoints;
        message.success("已将起始网点位置设置为线路起点");
      }

      // 重新计算线路距离
      calculateDistance();

      // 更新地图中心点
      updateMapCenter();
    }
  }
};

// 添加更新地图中心点的辅助函数
const updateMapCenter = () => {
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

// 定义百度地图实例接口
interface BMapInstance {
  setViewport: (
    points: Array<{ lng: number; lat: number }>,
    options?: any
  ) => void;
  [key: string]: any;
}

// 修改百度地图实例变量
const baiduMapRef = ref(null);
const baiduMapInstance = ref<BMapInstance | null>(null);

// 修改地图加载完成处理函数
const handleMapReady = (e: any) => {
  baiduMapInstance.value = e.map;

  // 如果是编辑模式，自动触发总览全图
  if (modalTitle.value === "编辑线路" && routeForm.points.length >= 2) {
    // 给地图一点时间来初始化
    setTimeout(() => {
      viewAllPoints();
    }, 300);
  }
};

// 修改总览点位方法，使用保存的地图实例
const viewAllPoints = () => {
  if (routeForm.points.length < 2) {
    console.log("需要至少两个点才能总览");
    return;
  }

  try {
    // 使用保存的地图实例
    if (baiduMapInstance.value) {
      const map = baiduMapInstance.value;

      // 使用setViewport方法调整视图
      map.setViewport(
        routeForm.points.map((p) => ({ lng: p.lng, lat: p.lat })),
        {
          margins: [50, 50, 50, 50], // 设置边距
          zoomFactor: -1, // 自动调整缩放级别
        }
      );

      console.log("已显示所有线路点位");
    } else {
      // 如果地图实例尚未准备好，延迟重试
      console.log("地图尚未加载完成，将在500ms后重试");
      setTimeout(() => {
        viewAllPoints();
      }, 500);
    }
  } catch (error) {
    console.error("地图操作失败:", error);
    // 静默失败，不显示错误消息以避免用户体验不佳
  }
};

// 新增自动生成线路的计算属性
const canGenerateRoute = computed(() => {
  return routeForm.startOutletId && routeForm.endOutletId;
});

// 新增自动生成线路点的方法
const generateRoutePoints = () => {
  // 确保已选择起点和终点
  if (!routeForm.startOutletId || !routeForm.endOutletId) {
    message.warning("请先选择起点和终点网点");
    return;
  }

  // 确保起点和终点有有效坐标
  const startOutlet = outletList.value.find(
    (outlet) => outlet.id === routeForm.startOutletId
  );
  const endOutlet = outletList.value.find(
    (outlet) => outlet.id === routeForm.endOutletId
  );

  if (!startOutlet || !endOutlet) {
    message.error("找不到起点或终点网点信息");
    return;
  }

  if (
    !startOutlet.lng ||
    !startOutlet.lat ||
    !endOutlet.lng ||
    !endOutlet.lat
  ) {
    message.error("起点或终点网点缺少坐标信息");
    return;
  }

  // 显示加载状态
  message.loading("正在生成路线，请稍候...", 0);

  // 使用百度地图驾车路线规划API
  if (window.BMap) {
    try {
      // 创建起点和终点坐标
      const startPoint = new window.BMap.Point(
        parseFloat(startOutlet.lng),
        parseFloat(startOutlet.lat)
      );
      const endPoint = new window.BMap.Point(
        parseFloat(endOutlet.lng),
        parseFloat(endOutlet.lat)
      );

      // 创建驾车路线规划实例
      const routeSearch = new window.BMap.DrivingRoute(baiduMapInstance.value, {
        renderOptions: { map: baiduMapInstance.value, autoViewport: false },
        onSearchComplete: (results: any) => {
          // 隐藏加载提示
          message.destroy();

          if (!results || results.getNumPlans() === 0) {
            message.error("未找到从起点到终点的路线");
            return;
          }

          // 获取第一条路线方案
          const plan = results.getPlan(0);
          if (!plan) {
            message.error("无法获取路线方案");
            return;
          }

          // 清空现有点
          routeForm.points = [];

          // 添加起点
          routeForm.points.push({
            lng: parseFloat(startOutlet.lng),
            lat: parseFloat(startOutlet.lat),
            id: `point-start-${Date.now()}`,
          });

          // 获取路线中的所有路段
          const route = plan.getRoute(0);
          const pathArray = route.getPath();

          // 为了避免点太多，选择性添加路径点
          // 如果路径点数量大于20，则每隔几个点取一个
          const step =
            pathArray.length > 20 ? Math.floor(pathArray.length / 20) : 1;

          for (let i = 1; i < pathArray.length - 1; i += step) {
            routeForm.points.push({
              lng: pathArray[i].lng,
              lat: pathArray[i].lat,
              id: `point-${Date.now()}-${i}`,
            });
          }

          // 添加终点
          routeForm.points.push({
            lng: parseFloat(endOutlet.lng),
            lat: parseFloat(endOutlet.lat),
            id: `point-end-${Date.now()}`,
          });

          // 计算线路距离
          calculateDistance();

          // 显示所有点
          viewAllPoints();

          message.success(
            `已自动生成线路，共 ${
              routeForm.points.length
            } 个点，总里程约 ${routeForm.distance.toFixed(2)} 公里`
          );
        },
        onError: (error: any) => {
          // 隐藏加载提示
          message.destroy();
          console.error("路线规划失败:", error);
          message.error("路线规划失败，请稍后重试");
        },
      });

      // 执行路线搜索
      routeSearch.search(startPoint, endPoint);
    } catch (error) {
      // 隐藏加载提示
      message.destroy();
      console.error("自动生成线路失败:", error);
      message.error("自动生成线路失败，请稍后重试");
    }
  } else {
    // 隐藏加载提示
    message.destroy();
    message.error("百度地图API尚未加载完成，请稍后重试");
  }
};

// 初始化
onMounted(() => {
  fetchRouteList();
  fetchOutletOptions(); // 获取网点列表用于选择
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
  position: relative; /* 确保绝对定位的按钮相对于地图容器定位 */
}

.map {
  height: 100%;
  width: 100%;
}

.map-tools {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 10px;
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
</style>
