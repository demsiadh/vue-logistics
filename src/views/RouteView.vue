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
            <a-select-option value="regular">常规线路</a-select-option>
            <a-select-option value="express">快速线路</a-select-option>
            <a-select-option value="special">特殊线路</a-select-option>
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
              :title="
                record.status === 'active'
                  ? '确定要禁用该线路吗？'
                  : '确定要启用该线路吗？'
              "
              @confirm="handleToggleStatus(record)"
            >
              <a>{{ record.status === "active" ? "禁用" : "启用" }}</a>
            </a-popconfirm>
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
            <a-select-option value="regular">常规线路</a-select-option>
            <a-select-option value="express">快速线路</a-select-option>
            <a-select-option value="special">特殊线路</a-select-option>
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
                :enable-editing="true"
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

interface Point {
  lng: number;
  lat: number;
  id?: string;
}

interface Route {
  id: string;
  routeId: string;
  name: string;
  type: string;
  status: string;
  description: string;
  points: Point[];
  distance: number; // 线路里程，单位公里
}

// 搜索表单数据
const searchForm = reactive({
  routeId: "",
  name: "",
  type: "",
  status: "",
});

// 表格列配置
const columns = [
  {
    title: "线路ID",
    dataIndex: "routeId",
    key: "routeId",
  },
  {
    title: "线路名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "线路类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "线路状态",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "线路里程(km)",
    dataIndex: "distance",
    key: "distance",
    customRender: ({ record }: { record: Route }) => {
      return record.distance ? record.distance.toFixed(2) : "0.00";
    },
  },
  {
    title: "线路描述",
    dataIndex: "description",
    key: "description",
    ellipsis: true, // 文本过长时显示省略号
    width: 200,
    customRender: ({ text }: { text: string }) => {
      return text || "暂无描述";
    },
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 300,
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
  type: "regular",
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
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    active: "green",
    inactive: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: "启用",
    inactive: "禁用",
  };
  return textMap[status] || "未知";
};

// 获取线路类型文本
const getRouteTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    regular: "常规线路",
    express: "快速线路",
    special: "特殊线路",
  };
  return textMap[type] || "未知";
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

// 获取线路列表
const fetchRouteList = () => {
  loading.value = true;
  // TODO: 实际项目中应该调用后端API获取数据

  // 模拟数据 - 真实的路线，具有更多的点位
  const mockData: Route[] = [
    {
      id: "1",
      routeId: "RT001",
      name: "北京-天津线路",
      type: "regular",
      status: "active",
      description: "北京到天津的常规配送线路",
      distance: 137.5, // 预计算的线路里程
      points: [
        { lng: 116.407526, lat: 39.90403, id: "1-1" }, // 北京站
        { lng: 116.427659, lat: 39.90379, id: "1-2" },
        { lng: 116.442679, lat: 39.889149, id: "1-3" },
        { lng: 116.484693, lat: 39.872308, id: "1-4" },
        { lng: 116.545761, lat: 39.823664, id: "1-5" },
        { lng: 116.59314, lat: 39.798487, id: "1-6" },
        { lng: 116.654252, lat: 39.761981, id: "1-7" },
        { lng: 116.70824, lat: 39.698218, id: "1-8" },
        { lng: 116.758322, lat: 39.654428, id: "1-9" },
        { lng: 116.841149, lat: 39.590481, id: "1-10" },
        { lng: 116.973672, lat: 39.484865, id: "1-11" },
        { lng: 117.033467, lat: 39.378639, id: "1-12" },
        { lng: 117.098785, lat: 39.284389, id: "1-13" },
        { lng: 117.14685, lat: 39.208989, id: "1-14" },
        { lng: 117.176291, lat: 39.143132, id: "1-15" },
        { lng: 117.195559, lat: 39.094051, id: "1-16" },
        { lng: 117.21058, lat: 39.057551, id: "1-17" },
        { lng: 117.208047, lat: 39.028114, id: "1-18" },
        { lng: 117.19513, lat: 39.000647, id: "1-19" },
        { lng: 117.177235, lat: 39.980987, id: "1-20" }, // 天津站
      ],
    },
    {
      id: "2",
      routeId: "RT002",
      name: "北京-石家庄快速线",
      type: "express",
      status: "active",
      description: "北京到石家庄的快速配送线路",
      distance: 298.2, // 预计算的线路里程
      points: [
        { lng: 116.407526, lat: 39.90403, id: "2-1" }, // 北京站
        { lng: 116.395252, lat: 39.86973, id: "2-2" },
        { lng: 116.346844, lat: 39.827951, id: "2-3" },
        { lng: 116.292814, lat: 39.76111, id: "2-4" },
        { lng: 116.209602, lat: 39.683952, id: "2-5" },
        { lng: 116.148834, lat: 39.602376, id: "2-6" },
        { lng: 116.033777, lat: 39.524644, id: "2-7" },
        { lng: 115.908122, lat: 39.428417, id: "2-8" },
        { lng: 115.795939, lat: 39.248136, id: "2-9" },
        { lng: 115.743454, lat: 39.145741, id: "2-10" },
        { lng: 115.694189, lat: 39.029471, id: "2-11" },
        { lng: 115.578447, lat: 38.873681, id: "2-12" },
        { lng: 115.496563, lat: 38.755892, id: "2-13" },
        { lng: 115.424981, lat: 38.576749, id: "2-14" },
        { lng: 115.354543, lat: 38.498345, id: "2-15" },
        { lng: 115.287766, lat: 38.415764, id: "2-16" },
        { lng: 115.064563, lat: 38.268961, id: "2-17" },
        { lng: 114.853507, lat: 38.302136, id: "2-18" },
        { lng: 114.641021, lat: 38.299879, id: "2-19" },
        { lng: 114.509872, lat: 38.042761, id: "2-20" }, // 石家庄站
      ],
    },
    {
      id: "3",
      routeId: "RT003",
      name: "北京-上海特殊线",
      type: "special",
      status: "inactive",
      description: "北京到上海的特殊配送线路",
      distance: 1318.5, // 预计算的线路里程
      points: [
        { lng: 116.407526, lat: 39.90403, id: "3-1" }, // 北京站
        { lng: 116.589798, lat: 39.78644, id: "3-2" },
        { lng: 116.832355, lat: 39.567348, id: "3-3" },
        { lng: 117.120345, lat: 39.184556, id: "3-4" },
        { lng: 117.354123, lat: 38.75621, id: "3-5" },
        { lng: 117.695245, lat: 38.234156, id: "3-6" },
        { lng: 118.045234, lat: 37.687432, id: "3-7" },
        { lng: 118.254678, lat: 37.128764, id: "3-8" },
        { lng: 118.534879, lat: 36.673219, id: "3-9" },
        { lng: 118.876532, lat: 36.128765, id: "3-10" },
        { lng: 119.123456, lat: 35.765432, id: "3-11" },
        { lng: 119.432178, lat: 35.234567, id: "3-12" },
        { lng: 119.765432, lat: 34.765432, id: "3-13" },
        { lng: 120.123456, lat: 34.234567, id: "3-14" },
        { lng: 120.432178, lat: 33.765432, id: "3-15" },
        { lng: 120.765432, lat: 33.234567, id: "3-16" },
        { lng: 121.032178, lat: 32.765432, id: "3-17" },
        { lng: 121.276543, lat: 32.123456, id: "3-18" },
        { lng: 121.432178, lat: 31.654321, id: "3-19" },
        { lng: 121.473701, lat: 31.230416, id: "3-20" }, // 上海站
      ],
    },
    {
      id: "4",
      routeId: "RT004",
      name: "北京-广州线路",
      type: "regular",
      status: "active",
      description: "北京到广州的常规配送线路",
      distance: 2198.7, // 预计算的线路里程
      points: [
        { lng: 116.407526, lat: 39.90403, id: "4-1" }, // 北京站
        { lng: 116.234567, lat: 39.54321, id: "4-2" },
        { lng: 115.987654, lat: 39.123456, id: "4-3" },
        { lng: 115.345678, lat: 38.765432, id: "4-4" },
        { lng: 114.876543, lat: 38.123456, id: "4-5" },
        { lng: 114.234567, lat: 37.54321, id: "4-6" },
        { lng: 113.987654, lat: 36.876543, id: "4-7" },
        { lng: 113.456789, lat: 36.234567, id: "4-8" },
        { lng: 113.123456, lat: 35.765432, id: "4-9" },
        { lng: 112.876543, lat: 35.234567, id: "4-10" },
        { lng: 112.456789, lat: 34.654321, id: "4-11" },
        { lng: 112.123456, lat: 33.987654, id: "4-12" },
        { lng: 111.654321, lat: 32.876543, id: "4-13" },
        { lng: 111.123456, lat: 31.54321, id: "4-14" },
        { lng: 110.654321, lat: 30.234567, id: "4-15" },
        { lng: 110.123456, lat: 28.765432, id: "4-16" },
        { lng: 113.321928, lat: 26.654321, id: "4-17" },
        { lng: 112.876543, lat: 24.987654, id: "4-18" },
        { lng: 113.098765, lat: 23.54321, id: "4-19" },
        { lng: 113.264435, lat: 23.129163, id: "4-20" }, // 广州站
      ],
    },
    {
      id: "5",
      routeId: "RT005",
      name: "北京-深圳快速线",
      type: "express",
      status: "inactive",
      description: "北京到深圳的快速配送线路",
      distance: 2287.3, // 预计算的线路里程
      points: [
        { lng: 116.407526, lat: 39.90403, id: "5-1" }, // 北京站
        { lng: 116.123456, lat: 39.654321, id: "5-2" },
        { lng: 115.765432, lat: 39.098765, id: "5-3" },
        { lng: 115.345678, lat: 38.54321, id: "5-4" },
        { lng: 114.987654, lat: 37.876543, id: "5-5" },
        { lng: 114.456789, lat: 37.234567, id: "5-6" },
        { lng: 113.987654, lat: 36.54321, id: "5-7" },
        { lng: 113.456789, lat: 35.876543, id: "5-8" },
        { lng: 112.987654, lat: 35.123456, id: "5-9" },
        { lng: 112.456789, lat: 34.54321, id: "5-10" },
        { lng: 111.987654, lat: 33.765432, id: "5-11" },
        { lng: 111.345678, lat: 32.876543, id: "5-12" },
        { lng: 110.876543, lat: 31.987654, id: "5-13" },
        { lng: 110.234567, lat: 30.54321, id: "5-14" },
        { lng: 110.098765, lat: 29.234567, id: "5-15" },
        { lng: 111.345678, lat: 27.54321, id: "5-16" },
        { lng: 112.456789, lat: 25.876543, id: "5-17" },
        { lng: 113.234567, lat: 24.654321, id: "5-18" },
        { lng: 113.765432, lat: 23.54321, id: "5-19" },
        { lng: 114.085947, lat: 22.547001, id: "5-20" }, // 深圳站
      ],
    },
  ];

  // 根据筛选条件过滤数据
  let filteredData = [...mockData];

  // 线路ID模糊匹配
  if (searchForm.routeId) {
    filteredData = filteredData.filter((item) =>
      item.routeId.toLowerCase().includes(searchForm.routeId.toLowerCase())
    );
  }

  // 线路名称模糊匹配
  if (searchForm.name) {
    filteredData = filteredData.filter((item) =>
      item.name.toLowerCase().includes(searchForm.name.toLowerCase())
    );
  }

  // 线路类型筛选
  if (searchForm.type) {
    filteredData = filteredData.filter((item) => item.type === searchForm.type);
  }

  // 线路状态筛选
  if (searchForm.status) {
    filteredData = filteredData.filter(
      (item) => item.status === searchForm.status
    );
  }

  // 模拟分页（实际项目中应该由后端处理）
  const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 10);
  const end = start + (pagination.pageSize || 10);
  routeList.value = filteredData.slice(start, end);
  pagination.total = filteredData.length;

  setTimeout(() => {
    loading.value = false;
  }, 500);
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
  routeForm.type = "regular";
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
  Object.assign(routeForm, record);
  // 深拷贝线路点，避免直接修改原数据
  routeForm.points = JSON.parse(JSON.stringify(record.points));
  showPointsList.value = false; // 重置列表显示状态
  modalVisible.value = true;

  // 计算线路中心点作为地图中心
  if (record.points && record.points.length > 0) {
    const lngSum = record.points.reduce(
      (sum: number, point: Point) => sum + point.lng,
      0
    );
    const latSum = record.points.reduce(
      (sum: number, point: Point) => sum + point.lat,
      0
    );
    const count = record.points.length;

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

// 计算两点之间的距离（百度地图坐标）
const calculateDistance = (point1: Point, point2: Point): number => {
  const radLat1 = (point1.lat * Math.PI) / 180.0;
  const radLat2 = (point2.lat * Math.PI) / 180.0;
  const a = radLat1 - radLat2;
  const b = (point1.lng * Math.PI) / 180.0 - (point2.lng * Math.PI) / 180.0;
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    );
  s = s * 6378.137; // 地球半径
  s = Math.round(s * 10000) / 10000; // 四舍五入，保留4位小数
  return s;
};

// 计算线路总里程
const calculateTotalDistance = (points: Point[]): number => {
  let totalDistance = 0;
  if (points.length < 2) return totalDistance;

  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }
  return totalDistance;
};

// 更新线路表单里程
const updateRouteDistance = () => {
  // 距离不再由前端计算，后端会处理
  // routeForm.distance = calculateTotalDistance(routeForm.points);
  console.log("线路点已更新，距离将由后端计算");
};

// 处理地图点击事件
const handleMapClick = (e: any) => {
  console.log("地图点击事件:", e);
  if (isAddingPoint.value) {
    // 百度地图事件处理，获取点击位置的坐标
    const lng = e.point ? e.point.lng : e.latlng ? e.latlng.lng : null;
    const lat = e.point ? e.point.lat : e.latlng ? e.latlng.lat : null;

    if (lng !== null && lat !== null) {
      const point = {
        lng: lng,
        lat: lat,
        id: `point-${Date.now()}`,
      };
      routeForm.points.push(point);

      // 不退出添加状态，允许连续添加点
      message.success(
        `已添加第 ${routeForm.points.length} 个点，点击地图继续添加点`
      );

      // 更新线路里程
      updateRouteDistance();
    } else {
      message.error("获取坐标失败，请重试");
    }
  }
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

// 清空线路点
const clearPoints = () => {
  routeForm.points = [];
};

// 移除线路点
const removePoint = (index: number) => {
  routeForm.points.splice(index, 1);
};

// 移动线路点
const movePoint = (index: number, direction: "up" | "down") => {
  if (direction === "up" && index > 0) {
    const temp = routeForm.points[index];
    routeForm.points[index] = routeForm.points[index - 1];
    routeForm.points[index - 1] = temp;
  } else if (direction === "down" && index < routeForm.points.length - 1) {
    const temp = routeForm.points[index];
    routeForm.points[index] = routeForm.points[index + 1];
    routeForm.points[index + 1] = temp;
  }
  // 重新计算线路里程
  updateRouteDistance();
};

// 处理标记拖拽结束
const handleMarkerDragend = (e: any, index: number) => {
  routeForm.points[index].lng = e.latlng.lng;
  routeForm.points[index].lat = e.latlng.lat;
  // 更新线路里程
  updateRouteDistance();
};

// 处理线路更新
const handleLineUpdate = (e: any) => {
  // 当用户在地图上直接编辑线路时，更新线路点
  if (e.target && e.target.getPath) {
    const path = e.target.getPath();
    routeForm.points = path.map((point: any, index: number) => ({
      lng: point.lng,
      lat: point.lat,
      id: routeForm.points[index]?.id || `point-${Date.now()}-${index}`,
    }));
    // 更新线路里程
    updateRouteDistance();
  }
};

// 处理弹窗确认
const handleModalOk = () => {
  routeFormRef.value.validate().then(() => {
    modalLoading.value = true;

    // 构建提交数据，移除distance字段，由后端计算
    const { distance, ...submitData } = { ...routeForm };

    // TODO: 调用后端API保存数据
    console.log("提交的线路数据:", submitData);

    setTimeout(() => {
      message.success(`${modalTitle.value}成功`);
      modalVisible.value = false;
      modalLoading.value = false;
      fetchRouteList();
    }, 500);
  });
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理切换状态
const handleToggleStatus = (record: Route) => {
  // TODO: 调用后端API更新状态
  const newStatus = record.status === "active" ? "inactive" : "active";
  message.success(`线路${newStatus === "active" ? "启用" : "禁用"}成功`);
  fetchRouteList();
};

// 处理删除
const handleDelete = (record: Route) => {
  // TODO: 调用后端API删除数据
  message.success("删除成功");
  fetchRouteList();
};

// 添加方法：确保线路点按顺序排列
const sortRoutePoints = () => {
  // 这里我们不实际排序，因为线路点的顺序本身就定义了路径
  // 但是可以在这里添加逻辑来确保线路是连续的
  message.success("线路点已按顺序连接形成折线");
  updateRouteDistance();
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
