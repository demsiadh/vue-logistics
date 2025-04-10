<template>
  <div id="homeView">
    <a-row :gutter="[16, 16]" class="dashboard-container">
      <!-- 地图区域 -->
      <a-col :span="12">
        <a-card title="营业网点分布" :bordered="false">
          <div class="map-container">
            <baidu-map
              class="bmap"
              :center="center"
              :zoom="zoom"
              :scroll-wheel-zoom="true"
            >
              <bm-marker
                v-for="point in branchPoints"
                :key="point.id"
                :position="{ lng: point.lng, lat: point.lat }"
                :dragging="false"
                animation="BMAP_ANIMATION_DROP"
                @click="showBranchInfo(point)"
              >
                <bm-info-window
                  :show="point.id === selectedBranch?.id"
                  @close="closeInfoWindow"
                  @open="infoWindowOpen"
                >
                  <div class="branch-info">
                    <h4>{{ point.name }}</h4>
                    <p>地址：{{ point.address }}</p>
                    <p>电话：{{ point.phone }}</p>
                    <p>营业时间：{{ point.businessHours }}</p>
                  </div>
                </bm-info-window>
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

      <!-- 营业网点统计 -->
      <a-col :span="12">
        <a-card title="营业网点统计" :bordered="false">
          <v-chart class="chart" :option="branchChartOption" />
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

// 地图中心点（设置在全国中心位置）
const center = ref({ lng: 116.404, lat: 35.915 });
const zoom = ref(5);

// 营业网点数据结构
interface BranchPoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  address: string;
  phone: string;
  businessHours: string;
  dailyOrders: number;
  serviceArea: number;
}

// 模拟营业网点数据
const branchPoints = ref<BranchPoint[]>([
  {
    id: "BJ001",
    name: "北京总部",
    lng: 116.404,
    lat: 39.915,
    address: "北京市朝阳区建国路88号",
    phone: "010-12345678",
    businessHours: "09:00-18:00",
    dailyOrders: 200,
    serviceArea: 5000,
  },
  {
    id: "SH001",
    name: "上海分部",
    lng: 121.473,
    lat: 31.23,
    address: "上海市浦东新区陆家嘴西路88号",
    phone: "021-12345678",
    businessHours: "09:00-18:00",
    dailyOrders: 180,
    serviceArea: 4500,
  },
  {
    id: "GZ001",
    name: "广州分部",
    lng: 113.264,
    lat: 23.129,
    address: "广州市天河区珠江新城88号",
    phone: "020-12345678",
    businessHours: "09:00-18:00",
    dailyOrders: 150,
    serviceArea: 4000,
  },
  {
    id: "CD001",
    name: "成都分部",
    lng: 104.065,
    lat: 30.659,
    address: "成都市武侯区天府大道88号",
    phone: "028-12345678",
    businessHours: "09:00-18:00",
    dailyOrders: 120,
    serviceArea: 3500,
  },
  {
    id: "SZ001",
    name: "深圳分部",
    lng: 114.057,
    lat: 22.543,
    address: "深圳市南山区科技园88号",
    phone: "0755-12345678",
    businessHours: "09:00-18:00",
    dailyOrders: 140,
    serviceArea: 3800,
  },
]);

// 选中的营业网点
const selectedBranch = ref<BranchPoint | null>(null);

// 显示网点信息
const showBranchInfo = (point: BranchPoint) => {
  selectedBranch.value = point;
};

// 关闭信息窗口
const closeInfoWindow = () => {
  selectedBranch.value = null;
};

// 信息窗口打开回调
const infoWindowOpen = () => {
  console.log("信息窗口打开");
};

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

// 营业网点统计图表配置
const branchChartOption = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  legend: {
    data: ["日均订单", "服务面积(㎡)"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: branchPoints.value.map((item) => item.name),
  },
  yAxis: [
    {
      type: "value",
      name: "订单数",
      position: "left",
    },
    {
      type: "value",
      name: "面积(㎡)",
      position: "right",
    },
  ],
  series: [
    {
      name: "日均订单",
      type: "bar",
      data: branchPoints.value.map((item) => item.dailyOrders),
    },
    {
      name: "服务面积(㎡)",
      type: "line",
      yAxisIndex: 1,
      data: branchPoints.value.map((item) => item.serviceArea),
    },
  ],
});
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
  width: 100%;
  height: 100%;
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

.branch-info {
  padding: 8px;
  max-width: 300px;
}

.branch-info h4 {
  margin: 0 0 8px 0;
  color: #1890ff;
}

.branch-info p {
  margin: 4px 0;
  font-size: 14px;
}
</style>
