<template>
  <div id="homeView">
    <a-row :gutter="[16, 16]" class="dashboard-container">
      <!-- 地图区域 -->
      <a-col :span="12">
        <a-card title="物流配送地图" :bordered="false">
          <div class="map-container">
            <baidu-map
              class="bmap"
              :center="center"
              :zoom="zoom"
              :scroll-wheel-zoom="true"
            >
              <bm-marker
                :position="center"
                :dragging="true"
                animation="BMAP_ANIMATION_BOUNCE"
              >
                <bm-info-window
                  :content="infoWindowContent"
                  :title="infoWindowTitle"
                />
              </bm-marker>
            </baidu-map>
          </div>
        </a-card>
      </a-col>

      <!-- 订单统计图表 -->
      <a-col :span="12">
        <a-card title="订单统计" :bordered="false">
          <v-chart class="chart" :option="orderChartOption" />
        </a-card>
      </a-col>

      <!-- 车辆状态图表 -->
      <a-col :span="12">
        <a-card title="车辆状态" :bordered="false">
          <v-chart class="chart" :option="vehicleChartOption" />
        </a-card>
      </a-col>

      <!-- 仓库库存统计 -->
      <a-col :span="12">
        <a-card title="仓库库存统计" :bordered="false">
          <v-chart class="chart" :option="warehouseChartOption" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { BaiduMap, BmMarker, BmInfoWindow } from "vue-baidu-map-3x";
import VChart from "vue-echarts";
import * as echarts from "echarts";

const router = useRouter();

// 地图中心点
const center = ref({ lng: 116.404, lat: 39.915 });
const zoom = ref(15);

// 信息窗口内容
const infoWindowTitle = ref("北京总部");
const infoWindowContent = ref("这里是领运物流的总部");

// 订单统计数据结构
interface OrderStatistics {
  date: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

// 模拟订单统计数据
const orderStatisticsData = ref<OrderStatistics[]>([
  {
    date: "2024-03-01",
    totalOrders: 156,
    completedOrders: 142,
    pendingOrders: 10,
    cancelledOrders: 4,
  },
  {
    date: "2024-03-02",
    totalOrders: 189,
    completedOrders: 175,
    pendingOrders: 12,
    cancelledOrders: 2,
  },
  {
    date: "2024-03-03",
    totalOrders: 178,
    completedOrders: 165,
    pendingOrders: 8,
    cancelledOrders: 5,
  },
  {
    date: "2024-03-04",
    totalOrders: 210,
    completedOrders: 195,
    pendingOrders: 13,
    cancelledOrders: 2,
  },
  {
    date: "2024-03-05",
    totalOrders: 198,
    completedOrders: 180,
    pendingOrders: 15,
    cancelledOrders: 3,
  },
  {
    date: "2024-03-06",
    totalOrders: 167,
    completedOrders: 155,
    pendingOrders: 9,
    cancelledOrders: 3,
  },
  {
    date: "2024-03-07",
    totalOrders: 145,
    completedOrders: 132,
    pendingOrders: 11,
    cancelledOrders: 2,
  },
]);

// 订单统计图表配置
const orderChartOption = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
    },
  },
  legend: {
    data: ["总订单", "已完成", "待处理", "已取消"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: orderStatisticsData.value.map((item) => item.date),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "总订单",
      type: "line",
      data: orderStatisticsData.value.map((item) => item.totalOrders),
      smooth: true,
      lineStyle: { width: 3 },
    },
    {
      name: "已完成",
      type: "line",
      data: orderStatisticsData.value.map((item) => item.completedOrders),
      smooth: true,
    },
    {
      name: "待处理",
      type: "line",
      data: orderStatisticsData.value.map((item) => item.pendingOrders),
      smooth: true,
    },
    {
      name: "已取消",
      type: "line",
      data: orderStatisticsData.value.map((item) => item.cancelledOrders),
      smooth: true,
    },
  ],
});

// 车辆状态数据结构
interface VehicleStatus {
  status: string;
  count: number;
  percentage: number;
}

// 模拟车辆状态数据
const vehicleStatusData = ref<VehicleStatus[]>([
  { status: "运行中", count: 42, percentage: 75 },
  { status: "维修中", count: 8, percentage: 14 },
  { status: "空闲", count: 6, percentage: 11 },
]);

// 车辆状态图表配置
const vehicleChartOption = ref({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
    data: vehicleStatusData.value.map((item) => item.status),
  },
  series: [
    {
      name: "车辆状态",
      type: "pie",
      radius: ["50%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "{b}: {c}辆",
      },
      emphasis: {
        label: {
          show: true,
          fontSize: "16",
          fontWeight: "bold",
        },
      },
      data: vehicleStatusData.value.map((item) => ({
        value: item.count,
        name: item.status,
      })),
    },
  ],
});

// 仓库库存数据结构
interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  totalCapacity: number;
  currentStock: number;
  utilizationRate: number;
  categories: {
    category: string;
    quantity: number;
  }[];
}

// 模拟仓库库存数据
const warehouseInventoryData = ref<WarehouseInventory[]>([
  {
    warehouseId: "BJ001",
    warehouseName: "北京仓",
    totalCapacity: 1000,
    currentStock: 850,
    utilizationRate: 85,
    categories: [
      { category: "电子产品", quantity: 300 },
      { category: "服装", quantity: 250 },
      { category: "食品", quantity: 200 },
      { category: "其他", quantity: 100 },
    ],
  },
  {
    warehouseId: "SH001",
    warehouseName: "上海仓",
    totalCapacity: 1200,
    currentStock: 980,
    utilizationRate: 82,
    categories: [
      { category: "电子产品", quantity: 400 },
      { category: "服装", quantity: 300 },
      { category: "食品", quantity: 180 },
      { category: "其他", quantity: 100 },
    ],
  },
  {
    warehouseId: "GZ001",
    warehouseName: "广州仓",
    totalCapacity: 800,
    currentStock: 720,
    utilizationRate: 90,
    categories: [
      { category: "电子产品", quantity: 250 },
      { category: "服装", quantity: 200 },
      { category: "食品", quantity: 170 },
      { category: "其他", quantity: 100 },
    ],
  },
  {
    warehouseId: "SZ001",
    warehouseName: "深圳仓",
    totalCapacity: 900,
    currentStock: 810,
    utilizationRate: 90,
    categories: [
      { category: "电子产品", quantity: 350 },
      { category: "服装", quantity: 200 },
      { category: "食品", quantity: 160 },
      { category: "其他", quantity: 100 },
    ],
  },
]);

// 仓库库存统计图表配置
const warehouseChartOption = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {
    data: ["总容量", "当前库存", "利用率"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: warehouseInventoryData.value.map((item) => item.warehouseName),
  },
  yAxis: [
    {
      type: "value",
      name: "数量",
      position: "left",
    },
    {
      type: "value",
      name: "利用率(%)",
      position: "right",
      max: 100,
    },
  ],
  series: [
    {
      name: "总容量",
      type: "bar",
      data: warehouseInventoryData.value.map((item) => item.totalCapacity),
    },
    {
      name: "当前库存",
      type: "bar",
      data: warehouseInventoryData.value.map((item) => item.currentStock),
    },
    {
      name: "利用率",
      type: "line",
      yAxisIndex: 1,
      data: warehouseInventoryData.value.map((item) => item.utilizationRate),
    },
  ],
});

// 统计数据
const orderCount = ref(1234);
const vehicleCount = ref(56);
const warehouseCount = ref(10);
</script>

<style scoped>
#homeView {
  padding: 16px;
  color: #333;
  background: #f0f2f5;
  min-height: calc(100vh - 64px); /* 减去导航栏高度 */
  box-sizing: border-box;
}

.dashboard-container {
  height: calc(100vh - 96px); /* 减去导航栏和padding的高度 */
  margin: 0;
}

:deep(.ant-card) {
  height: calc(50vh - 56px); /* 每个卡片高度为视口高度的一半减去间距 */
  margin-bottom: 16px;
}

:deep(.ant-card-body) {
  height: calc(100% - 57px); /* 减去卡片头部高度 */
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bmap {
  width: 90%;
  height: 90%;
}

.chart {
  width: 100%;
  height: 90%;
}

:deep(.ant-card-head) {
  min-height: 48px;
  padding: 0 16px;
}

:deep(.ant-card-head-title) {
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
}

:deep(.ant-row) {
  margin: 0 !important;
}

:deep(.ant-col) {
  padding: 0 !important;
}
</style>
