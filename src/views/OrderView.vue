<template>
  <div class="order-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="订单编号">
          <a-input
            v-model:value="searchForm.orderId"
            placeholder="请输入订单编号"
          />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input
            v-model:value="searchForm.phone"
            placeholder="请输入客户手机号"
          />
        </a-form-item>
        <a-form-item label="订单状态">
          <a-select
            v-model:value="searchForm.status"
            style="width: 120px"
            placeholder="请选择状态"
          >
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">待处理</a-select-option>
            <a-select-option :value="2">处理中</a-select-option>
            <a-select-option :value="3">已完成</a-select-option>
            <a-select-option :value="4">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            :locale="zhCN"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
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
        新增订单
      </a-button>
    </div>

    <!-- 订单表格 -->
    <a-table
      :columns="columns"
      :data-source="orderList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="orderId"
    >
      <!-- 订单状态列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showDetailModal(record)">查看</a>
            <a-divider type="vertical" />
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除这个订单吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑订单弹窗 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
      width="800px"
    >
      <a-form
        :model="orderForm"
        :rules="rules"
        ref="orderFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="客户名称" name="customerName">
          <a-input v-model:value="orderForm.customerName" />
        </a-form-item>
        <a-form-item label="联系电话" name="phone">
          <a-input v-model:value="orderForm.phone" />
        </a-form-item>
        <template v-if="modalTitle === '新增订单'">
          <a-form-item label="发货地址" name="startAddress">
            <div class="address-input-container">
              <a-textarea
                v-model:value="orderForm.startAddress"
                :rows="2"
                @change="handleStartAddressChange"
                placeholder="请输入或在地图上选择发货地址"
              />
              <div class="map-container">
                <baidu-map
                  class="map"
                  :center="startMapCenter"
                  :zoom="15"
                  @click="handleStartMapClick"
                >
                  <bm-marker :position="startMarkerPosition" />
                </baidu-map>
              </div>
            </div>
          </a-form-item>
          <a-form-item label="收货地址" name="endAddress">
            <div class="address-input-container">
              <a-textarea
                v-model:value="orderForm.endAddress"
                :rows="2"
                @change="handleEndAddressChange"
                placeholder="请输入或在地图上选择收货地址"
              />
              <div class="map-container">
                <baidu-map
                  class="map"
                  :center="endMapCenter"
                  :zoom="15"
                  @click="handleEndMapClick"
                >
                  <bm-marker :position="endMarkerPosition" />
                </baidu-map>
              </div>
            </div>
          </a-form-item>
          <a-form-item label="货物重量" name="weight">
            <a-input-number
              v-model:value="orderForm.weight"
              :min="0"
              :precision="2"
              :step="0.1"
              addon-after="吨"
            />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item label="订单状态" name="status">
            <a-select v-model:value="orderForm.status">
              <a-select-option :value="1">待处理</a-select-option>
              <a-select-option :value="2">处理中</a-select-option>
              <a-select-option :value="3">已完成</a-select-option>
              <a-select-option :value="4">已取消</a-select-option>
            </a-select>
          </a-form-item>
        </template>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="orderForm.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 订单详情弹窗 -->
    <a-modal
      title="订单详情"
      v-model:visible="detailModalVisible"
      :footer="null"
      width="1000px"
      :destroyOnClose="true"
      :afterClose="handleDetailModalAfterClose"
    >
      <div class="detail-container">
        <div class="detail-info">
          <a-descriptions bordered :column="1">
            <a-descriptions-item label="订单编号">
              {{ detailData.orderId }}
            </a-descriptions-item>
            <a-descriptions-item label="客户名称">
              {{ detailData.customerName }}
            </a-descriptions-item>
            <a-descriptions-item label="联系电话">
              {{ detailData.phone }}
            </a-descriptions-item>
            <a-descriptions-item label="发货地址">
              {{ detailData.startAddress }}
            </a-descriptions-item>
            <a-descriptions-item label="发货网点">
              {{ detailData.startOutlet?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="收货地址">
              {{ detailData.endAddress }}
            </a-descriptions-item>
            <a-descriptions-item label="收货网点">
              {{ detailData.endOutlet?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="运输车牌号">
              {{ detailData.transPortVehicle?.plateNumber }}
            </a-descriptions-item>
            <a-descriptions-item label="线路名称">
              {{ detailData.route?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="线路距离">
              {{ detailData.route?.distance?.toFixed(2) }} 公里
            </a-descriptions-item>
            <a-descriptions-item label="货物重量">
              {{ detailData.weight }} 吨
            </a-descriptions-item>
            <a-descriptions-item label="订单状态">
              <a-tag :color="getStatusColor(detailData.status)">
                {{ getStatusText(detailData.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(detailData.createTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="备注">
              {{ detailData.remark || "无" }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
        <div class="detail-map">
          <div v-if="loadingDetailMap" class="map-loading">
            <a-spin tip="地图加载中..."></a-spin>
          </div>
          <div class="map-controls">
            <a-button type="primary" @click="viewFullMap">
              <template #icon><fullscreen-outlined /></template>
              查看全图
            </a-button>
          </div>
          <baidu-map
            v-if="detailModalVisible && detailMapReady"
            :key="'detail-map-' + detailModalVisible + '-' + detailMapReady"
            ref="mapRef"
            class="map"
            :center="detailMapCenter"
            :zoom="detailMapZoom"
            :scroll-wheel-zoom="true"
            @ready="handleDetailMapReady"
            @error="(e: any) => console.error('Baidu Map error:', e)"
          >
            <!-- 起点标记 -->
            <bm-marker
              :position="{
                lng: parseFloat(detailData.startLng.toString()),
                lat: parseFloat(detailData.startLat.toString()),
              }"
            >
              <bm-label
                :content="detailData.startOutlet?.name"
                :labelStyle="{
                  color: '#fff',
                  backgroundColor: '#1890ff',
                  border: '1px solid #1890ff',
                  padding: '5px',
                  borderRadius: '3px',
                }"
              />
            </bm-marker>
            <!-- 终点标记 -->
            <bm-marker
              :position="{
                lng: parseFloat(detailData.endLng.toString()),
                lat: parseFloat(detailData.endLat.toString()),
              }"
            >
              <bm-label
                :content="detailData.endOutlet?.name"
                :labelStyle="{
                  color: '#fff',
                  backgroundColor: '#52c41a',
                  border: '1px solid #52c41a',
                  padding: '5px',
                  borderRadius: '3px',
                }"
              />
            </bm-marker>
            <!-- 车辆位置标记 -->
            <bm-marker
              v-if="detailData.transPortVehicle"
              :position="{
                lng: parseFloat(detailData.transPortVehicle.lng),
                lat: parseFloat(detailData.transPortVehicle.lat),
              }"
            >
              <bm-label
                :content="detailData.transPortVehicle.plateNumber"
                :labelStyle="{
                  color: '#fff',
                  backgroundColor: '#faad14',
                  border: '1px solid #faad14',
                  padding: '5px',
                  borderRadius: '3px',
                }"
              />
            </bm-marker>
            <!-- 路线 -->
            <bm-polyline
              v-if="detailData.route"
              :path="
                detailData.route.points.map((point) => ({
                  lng: point.Coordinates[0],
                  lat: point.Coordinates[1],
                }))
              "
              :strokeColor="'#1890ff'"
              :strokeWeight="3"
            />
          </baidu-map>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, FullscreenOutlined } from "@ant-design/icons-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import zhCN from "ant-design-vue/es/date-picker/locale/zh_CN";
import "dayjs/locale/zh-cn";
import {
  getOrderList,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderTotalCount,
  getOrderDetail,
} from "@/api/order";
import { BaiduMap, BmMarker } from "vue-baidu-map-3x";

// 声明全局 BMap 对象
declare const BMap: any;

// 设置dayjs的默认语言
dayjs.locale("zh-cn");

// 定义订单接口
interface Order {
  id: number;
  orderId: string;
  customerName: string;
  phone: string;
  startAddress: string;
  endAddress: string;
  startLng: number;
  startLat: number;
  endLng: number;
  endLat: number;
  weight: number;
  status: number;
  createTime: string;
  remark: string;
  transPortVehicle: {
    id: string;
    plateNumber: string;
    type: number;
    loadCapacity: number;
    currentLoad: number;
    status: number;
    routeId: string;
    routeName: string;
    remarks: string;
    lng: string;
    lat: string;
  };
  startOutlet: {
    id: string;
    name: string;
    phone: string;
    province: string;
    city: string;
    detailAddress: string;
    businessHours: string;
    lng: string;
    lat: string;
    scope: Array<{
      Type: string;
      Coordinates: number[];
    }>;
    status: number;
    remark: string;
  };
  endOutlet: {
    id: string;
    name: string;
    phone: string;
    province: string;
    city: string;
    detailAddress: string;
    businessHours: string;
    lng: string;
    lat: string;
    scope: Array<{
      Type: string;
      Coordinates: number[];
    }>;
    status: number;
    remark: string;
  };
  route: {
    id: string;
    routeId: string;
    name: string;
    type: number;
    status: number;
    description: string;
    points: Array<{
      Type: string;
      Coordinates: number[];
    }>;
    distance: number;
    startOutlet: string;
    endOutlet: string;
  };
}

// 搜索表单数据
interface SearchForm {
  orderId: string;
  phone: string;
  status: number;
  dateRange: [Dayjs, Dayjs] | [];
}

const searchForm = reactive<SearchForm>({
  orderId: "",
  phone: "",
  status: 0,
  dateRange: [],
});

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm");
};

// 表格列定义
const columns = [
  {
    title: "订单编号",
    dataIndex: "orderId",
    key: "orderId",
    width: 140,
  },
  {
    title: "客户名称",
    dataIndex: "customerName",
    key: "customerName",
    width: 120,
  },
  {
    title: "联系电话",
    dataIndex: "phone",
    key: "phone",
    width: 120,
  },
  {
    title: "发货地址",
    dataIndex: "startAddress",
    key: "startAddress",
    ellipsis: true,
    width: 180,
  },
  {
    title: "收货地址",
    dataIndex: "endAddress",
    key: "endAddress",
    ellipsis: true,
    width: 180,
  },
  {
    title: "运输车牌号",
    dataIndex: "transPortVehicle",
    key: "transPortVehicle",
    width: 120,
  },
  {
    title: "订单状态",
    dataIndex: "status",
    key: "status",
    width: 100,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    sorter: true,
    width: 160,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 200,
  },
];

// 分页配置
const pagination = reactive<TablePaginationConfig>({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 订单列表数据
const orderList = ref<Order[]>([]);

// 获取订单列表数据
const fetchOrderList = async () => {
  loading.value = true;
  try {
    const params = {
      orderId: searchForm.orderId || "",
      phone: searchForm.phone || "",
      status: searchForm.status || 0,
      startTime: searchForm.dateRange[0]
        ? new Date(
            searchForm.dateRange[0].format("YYYY-MM-DD") + " 00:00:00 UTC"
          ).toISOString()
        : new Date("2025-01-01 00:00:00 UTC").toISOString(),
      endTime: searchForm.dateRange[1]
        ? new Date(
            searchForm.dateRange[1].format("YYYY-MM-DD") + " 23:59:59 UTC"
          ).toISOString()
        : new Date().toISOString(),
      page: {
        skip: pagination.current || 1,
        limit: pagination.pageSize || 10,
      },
    };

    // 并行请求列表数据和总数
    const [response, totalRes] = await Promise.all([
      getOrderList(params),
      getOrderTotalCount(params),
    ]);

    if (response.data.code === 0) {
      orderList.value = response.data.data;
      // 使用总数接口返回的数据
      if (totalRes.data.code === 0) {
        pagination.total = totalRes.data.data || 0;
      }
    } else {
      orderList.value = [];
      pagination.total = 0;
      message.error(response.data.message || "获取订单列表失败");
    }
  } catch (error) {
    console.error("获取订单列表出错:", error);
    message.error("获取订单列表失败，请稍后重试");
    orderList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    1: "orange",
    2: "blue",
    3: "green",
    4: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    1: "待处理",
    2: "处理中",
    3: "已完成",
    4: "已取消",
  };
  return textMap[status] || "未知状态";
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
  fetchOrderList();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    orderId: "",
    phone: "",
    status: 0,
    dateRange: [],
  });
  pagination.current = 1;
  fetchOrderList();
};

// 表格变化处理
const handleTableChange = (pag: TablePaginationConfig) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchOrderList();
};

// 表单校验规则
const rules = {
  customerName: [{ required: true, message: "请输入客户名称" }],
  phone: [{ required: true, message: "请输入联系电话" }],
  startAddress: [{ required: true, message: "请输入发货地址" }],
  endAddress: [{ required: true, message: "请输入收货地址" }],
  weight: [{ required: true, message: "请输入货物重量" }],
  status: [{ required: true, message: "请选择订单状态" }],
};

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("新增订单");
const orderFormRef = ref();
const orderForm = reactive({
  orderId: "",
  customerName: "",
  phone: "",
  startAddress: "",
  endAddress: "",
  startLng: 0,
  startLat: 0,
  endLng: 0,
  endLat: 0,
  weight: 0,
  status: 1,
  remark: "",
});

// 地图相关状态
const startMapCenter = reactive({ lng: 116.404, lat: 39.915 });
const endMapCenter = reactive({ lng: 116.404, lat: 39.915 });
const startMarkerPosition = reactive({ lng: 116.404, lat: 39.915 });
const endMarkerPosition = reactive({ lng: 116.404, lat: 39.915 });

// 处理发货地址变化
const handleStartAddressChange = async () => {
  if (!orderForm.startAddress) return;
  try {
    const geocoder = new BMap.Geocoder();
    geocoder.getPoint(orderForm.startAddress, (point: any) => {
      if (point) {
        orderForm.startLng = point.lng;
        orderForm.startLat = point.lat;
        startMapCenter.lng = point.lng;
        startMapCenter.lat = point.lat;
        startMarkerPosition.lng = point.lng;
        startMarkerPosition.lat = point.lat;
      } else {
        message.warning("无法解析发货地址坐标");
      }
    });
  } catch (error) {
    console.error("地址解析失败:", error);
    message.error("地址解析失败");
  }
};

// 处理收货地址变化
const handleEndAddressChange = async () => {
  if (!orderForm.endAddress) return;
  try {
    const geocoder = new BMap.Geocoder();
    geocoder.getPoint(orderForm.endAddress, (point: any) => {
      if (point) {
        orderForm.endLng = point.lng;
        orderForm.endLat = point.lat;
        endMapCenter.lng = point.lng;
        endMapCenter.lat = point.lat;
        endMarkerPosition.lng = point.lng;
        endMarkerPosition.lat = point.lat;
      } else {
        message.warning("无法解析收货地址坐标");
      }
    });
  } catch (error) {
    console.error("地址解析失败:", error);
    message.error("地址解析失败");
  }
};

// 处理发货地址地图点击
const handleStartMapClick = (e: any) => {
  const point = e.point;
  orderForm.startLng = point.lng;
  orderForm.startLat = point.lat;
  startMarkerPosition.lng = point.lng;
  startMarkerPosition.lat = point.lat;

  // 反向解析地址
  const geocoder = new BMap.Geocoder();
  geocoder.getLocation(point, (result: any) => {
    if (result) {
      orderForm.startAddress = result.address;
    }
  });
};

// 处理收货地址地图点击
const handleEndMapClick = (e: any) => {
  const point = e.point;
  orderForm.endLng = point.lng;
  orderForm.endLat = point.lat;
  endMarkerPosition.lng = point.lng;
  endMarkerPosition.lat = point.lat;

  // 反向解析地址
  const geocoder = new BMap.Geocoder();
  geocoder.getLocation(point, (result: any) => {
    if (result) {
      orderForm.endAddress = result.address;
    }
  });
};

// 显示新增弹窗
const showAddModal = () => {
  modalTitle.value = "新增订单";
  Object.assign(orderForm, {
    orderId: "",
    customerName: "",
    phone: "",
    startAddress: "",
    endAddress: "",
    startLng: 0,
    startLat: 0,
    endLng: 0,
    endLat: 0,
    weight: 0,
    status: 1,
    remark: "",
  });
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Order) => {
  modalTitle.value = "编辑订单";
  Object.assign(orderForm, {
    orderId: record.orderId,
    customerName: record.customerName,
    phone: record.phone,
    status: record.status,
    remark: record.remark,
  });
  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    await orderFormRef.value.validate();
    modalLoading.value = true;

    if (modalTitle.value === "新增订单") {
      const createParams = {
        customerName: orderForm.customerName,
        phone: orderForm.phone,
        startAddress: orderForm.startAddress,
        endAddress: orderForm.endAddress,
        startLng: orderForm.startLng,
        startLat: orderForm.startLat,
        endLng: orderForm.endLng,
        endLat: orderForm.endLat,
        weight: orderForm.weight,
        remark: orderForm.remark,
      };
      const res = await createOrder(createParams);
      if (res.data.code === 0) {
        message.success("新增订单成功");
        modalVisible.value = false;
        fetchOrderList();
      } else {
        message.error(res.data.message || "新增订单失败");
      }
    } else {
      const updateParams = {
        orderId: orderForm.orderId,
        customerName: orderForm.customerName,
        phone: orderForm.phone,
        status: orderForm.status,
        remark: orderForm.remark,
      };
      const res = await updateOrder(updateParams);
      if (res.data.code === 0) {
        message.success("编辑订单成功");
        modalVisible.value = false;
        fetchOrderList();
      } else {
        message.error(res.data.message || "编辑订单失败");
      }
    }
  } catch (error) {
    console.error("表单验证失败:", error);
    message.error(
      modalTitle.value === "新增订单" ? "新增订单失败" : "编辑订单失败"
    );
  } finally {
    modalLoading.value = false;
  }
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = async (record: Order) => {
  try {
    const res = await deleteOrder(record.orderId);
    if (res.data.code === 0) {
      message.success("删除成功");
      fetchOrderList();
    } else {
      message.error(res.data.message || "删除失败");
    }
  } catch (error) {
    message.error("删除失败");
  }
};

// 详情弹窗相关
const detailModalVisible = ref(false);
const detailData = reactive<Order>({
  id: 0,
  orderId: "",
  customerName: "",
  phone: "",
  startAddress: "",
  endAddress: "",
  startLng: 0,
  startLat: 0,
  endLng: 0,
  endLat: 0,
  weight: 0,
  status: 0,
  createTime: "",
  remark: "",
  transPortVehicle: {
    id: "",
    plateNumber: "",
    type: 0,
    loadCapacity: 0,
    currentLoad: 0,
    status: 0,
    routeId: "",
    routeName: "",
    remarks: "",
    lng: "",
    lat: "",
  },
  startOutlet: {
    id: "",
    name: "",
    phone: "",
    province: "",
    city: "",
    detailAddress: "",
    businessHours: "",
    lng: "",
    lat: "",
    scope: [],
    status: 0,
    remark: "",
  },
  endOutlet: {
    id: "",
    name: "",
    phone: "",
    province: "",
    city: "",
    detailAddress: "",
    businessHours: "",
    lng: "",
    lat: "",
    scope: [],
    status: 0,
    remark: "",
  },
  route: {
    id: "",
    routeId: "",
    name: "",
    type: 0,
    status: 0,
    description: "",
    points: [],
    distance: 0,
    startOutlet: "",
    endOutlet: "",
  },
});

// 地图相关状态
const detailMapCenter = reactive({ lng: 116.404, lat: 39.915 });
const detailMapZoom = ref(5);
const mapRef = ref();
const detailMapReady = ref(false);
const loadingDetailMap = ref(false);

// 监听模态框可见性，重置地图状态
watch(detailModalVisible, (visible) => {
  if (visible) {
    // 延迟一下再初始化地图，确保DOM已经渲染
    setTimeout(() => {
      detailMapReady.value = true;
    }, 200);
  } else {
    handleDetailMapUnload();
    detailMapReady.value = false;
  }
});

// 地图卸载处理
const handleDetailMapUnload = () => {
  if (mapRef.value) {
    mapRef.value = null;
  }
};

// 处理地图加载完成
const handleDetailMapReady = ({ BMap, map }: any) => {
  loadingDetailMap.value = false;
  if (
    detailData.startLng &&
    detailData.startLat &&
    detailData.endLng &&
    detailData.endLat
  ) {
    try {
      const startPoint = new BMap.Point(
        parseFloat(detailData.startLng.toString()),
        parseFloat(detailData.startLat.toString())
      );
      const endPoint = new BMap.Point(
        parseFloat(detailData.endLng.toString()),
        parseFloat(detailData.endLat.toString())
      );

      // 创建边界对象
      const bounds = new BMap.Bounds();
      bounds.extend(startPoint);
      bounds.extend(endPoint);

      // 如果有车辆位置，也加入到边界中
      if (detailData.transPortVehicle) {
        const vehiclePoint = new BMap.Point(
          parseFloat(detailData.transPortVehicle.lng),
          parseFloat(detailData.transPortVehicle.lat)
        );
        bounds.extend(vehiclePoint);
      }

      // 设置视图以包含所有点
      map.setViewport(bounds);
    } catch (e) {
      console.error("Error setting map viewport:", e);
    }
  }
};

// 显示详情弹窗
const showDetailModal = async (record: Order) => {
  try {
    loadingDetailMap.value = true;
    const res = await getOrderDetail(record.orderId);
    if (res.data.code === 0) {
      Object.assign(detailData, res.data.data);
      // 设置地图中心点为起点和终点的中间位置
      const startLng = parseFloat(detailData.startLng.toString());
      const startLat = parseFloat(detailData.startLat.toString());
      const endLng = parseFloat(detailData.endLng.toString());
      const endLat = parseFloat(detailData.endLat.toString());
      detailMapCenter.lng = (startLng + endLng) / 2;
      detailMapCenter.lat = (startLat + endLat) / 2;
      detailModalVisible.value = true;
    } else {
      message.error(res.data.message || "获取订单详情失败");
    }
  } catch (error) {
    console.error("获取订单详情失败:", error);
    message.error("获取订单详情失败");
  } finally {
    loadingDetailMap.value = false;
  }
};

// 处理弹窗关闭之后的事件
const handleDetailModalAfterClose = () => {
  handleDetailMapUnload();
  detailMapReady.value = false;
};

// 查看全图
const viewFullMap = () => {
  if (mapRef.value) {
    const map = mapRef.value.map;
    const points = [
      new BMap.Point(
        parseFloat(detailData.startLng.toString()),
        parseFloat(detailData.startLat.toString())
      ),
      new BMap.Point(
        parseFloat(detailData.endLng.toString()),
        parseFloat(detailData.endLat.toString())
      ),
    ];
    if (detailData.transPortVehicle) {
      points.push(
        new BMap.Point(
          parseFloat(detailData.transPortVehicle.lng),
          parseFloat(detailData.transPortVehicle.lat)
        )
      );
    }
    map.setViewport(points);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchOrderList();
});
</script>

<style scoped>
.order-container {
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

.address-input-container {
  display: flex;
  gap: 16px;
}

.map-container {
  width: 300px;
  height: 200px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.map {
  width: 100%;
  height: 100%;
}

:deep(.ant-descriptions-item-label) {
  width: 120px;
  font-weight: bold;
}

:deep(.ant-table-cell .ant-space) {
  white-space: nowrap;
}

:deep(.ant-table-cell .ant-space-item) {
  display: inline-flex;
  align-items: center;
}

:deep(.ant-table-cell .ant-divider-vertical) {
  margin: 0 8px;
}

.detail-container {
  display: flex;
  gap: 24px;
}

.detail-info {
  flex: 1;
  min-width: 400px;
}

.detail-map {
  flex: 1;
  height: 600px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  position: relative;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.detail-map .map {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1000;
}
</style>
