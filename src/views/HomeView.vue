<template>
  <div id="homeView">
    <a-row :gutter="[16, 16]" class="dashboard-container">
      <!-- 地图区域 -->
      <a-col :span="12">
        <a-card title="营业网点分布" :bordered="false">
          <div class="map-container">
            <baidu-map
              v-if="isMounted"
              class="bmap"
              :center="center"
              :zoom="zoom"
              :scroll-wheel-zoom="true"
              @ready="handleMapReady"
            >
              <bm-marker
                v-for="point in branchPoints"
                :key="point.id"
                :position="{ lng: point.lng, lat: point.lat }"
                :dragging="false"
                animation="BMAP_ANIMATION_DROP"
                @click="handleMarkerClick(point)"
              >
              </bm-marker>
            </baidu-map>

            <!-- 自定义信息弹出层 -->
            <div
              v-if="selectedBranch && popupVisible"
              class="custom-info-window"
            >
              <div class="info-header">
                <h4>{{ selectedBranch.name }}</h4>
                <button class="close-btn" @click="popupVisible = false">
                  ×
                </button>
              </div>
              <div class="info-content">
                <p>省份：{{ selectedBranch.province }}</p>
                <p>城市：{{ selectedBranch.city }}</p>
                <p>地址：{{ selectedBranch.address }}</p>
                <p>电话：{{ selectedBranch.phone }}</p>
                <p>营业时间：{{ selectedBranch.businessHours }}</p>
              </div>
            </div>
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
        <a-card title="线路统计" :bordered="false">
          <v-chart class="chart" :option="routeChartOption" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { BaiduMap, BmMarker, BmInfoWindow } from "vue-baidu-map-3x";
import VChart from "vue-echarts";
import * as echarts from "echarts";
import {
  getOutletView,
  getOrderView,
  getRouteView,
  getVehicleView,
} from "@/api/home";

// 组件挂载状态
const isMounted = ref(false);

// 地图中心点（设置在全国中心位置）
const center = ref({ lng: 104.195397, lat: 35.86166 }); // 中国中心点
const zoom = ref(5); // 全国级别缩放

// 地图实例
const mapInstance = ref<any>(null);

// 营业网点数据结构
interface BranchPoint {
  id: string;
  name: string;
  lng: number;
  lat: number;
  province: string;
  city: string;
  address: string;
  phone: string;
  businessHours: string;
  status: number;
  remark: string;
}

// 营业网点数据
const branchPoints = ref<BranchPoint[]>([]);

// 选中的营业网点
const selectedBranch = ref<BranchPoint | null>(null);

// 弹出层可见状态
const popupVisible = ref(false);

// 处理标记点击
const handleMarkerClick = (point: BranchPoint) => {
  selectedBranch.value = point;
  popupVisible.value = true;
};

// 地图加载完成回调
const handleMapReady = ({ BMap, map }: any) => {
  try {
    mapInstance.value = map;
    window.BMap = BMap;

    // 设置地图控件
    map.addControl(new BMap.NavigationControl());
    map.addControl(new BMap.ScaleControl());
    map.addControl(new BMap.OverviewMapControl());

    // 如果有网点数据，调整地图视图
    if (branchPoints.value.length > 0) {
      const bounds = new BMap.Bounds();
      branchPoints.value.forEach((point) => {
        bounds.extend(new BMap.Point(point.lng, point.lat));
      });
      map.setViewport(bounds);
    }

    // 点击地图时关闭弹出层
    map.addEventListener("click", (e: any) => {
      if (e.overlay) return; // 如果点击的是标记，不处理
      popupVisible.value = false;
    });
  } catch (error) {
    console.error("地图初始化失败:", error);
  }
};

// 获取营业网点数据
const fetchOutletData = async () => {
  try {
    const res = await getOutletView();
    if (res.data.code === 0 && res.data.data) {
      const data = Array.isArray(res.data.data)
        ? res.data.data
        : [res.data.data];
      branchPoints.value = data
        .filter((outlet: any) => {
          const lng = Number(outlet.lng);
          const lat = Number(outlet.lat);
          return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
        })
        .map((outlet: any) => ({
          id: outlet.id,
          name: outlet.name,
          lng: Number(outlet.lng),
          lat: Number(outlet.lat),
          province: outlet.province,
          city: outlet.city,
          address: outlet.detailAddress,
          phone: outlet.phone,
          businessHours: outlet.businessHours,
          status: outlet.status,
          remark: outlet.remark,
        }));

      // 如果地图已经初始化，调整视图
      if (mapInstance.value && branchPoints.value.length > 0) {
        const bounds = new window.BMap.Bounds();
        branchPoints.value.forEach((point) => {
          bounds.extend(new window.BMap.Point(point.lng, point.lat));
        });
        mapInstance.value.setViewport(bounds);
      }
    }
  } catch (error) {
    console.error("获取营业网点数据失败:", error);
  }
};

// 监听网点数据变化
watch(
  branchPoints,
  (newVal) => {
    if (newVal.length > 0 && mapInstance.value) {
      try {
        const bounds = new window.BMap.Bounds();
        newVal.forEach((point) => {
          bounds.extend(new window.BMap.Point(point.lng, point.lat));
        });
        mapInstance.value.setViewport(bounds);
      } catch (error) {
        console.error("调整地图视图失败:", error);
      }
    }
  },
  { deep: true }
);

// 初始化
onMounted(async () => {
  try {
    // 等待下一个 tick 确保 DOM 更新
    await nextTick();
    isMounted.value = true;

    // 加载数据
    await fetchOutletData();
    fetchRouteData();
    fetchOrderStatistics();
    fetchVehicleStatus();
  } catch (error) {
    console.error("初始化失败:", error);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  isMounted.value = false;
  mapInstance.value = null;
  branchPoints.value = [];
  selectedBranch.value = null;
  popupVisible.value = false;
});

// 订单统计图表配置
const orderChartOption = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
    },
    formatter: (params: any) => {
      const date = params[0].axisValue;
      const data = params
        .map((item: any) => {
          return `${item.seriesName}: ${item.value}`;
        })
        .join("<br/>");
      return `${date}<br/>${data}`;
    },
  },
  legend: {
    data: ["总订单", "已完成", "待处理", "处理中", "已取消"],
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
    data: [] as string[],
    axisLabel: {
      formatter: (value: string) => {
        return value;
      },
    },
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "总订单",
      type: "line",
      data: [] as number[],
      smooth: true,
      lineStyle: { width: 3 },
    },
    {
      name: "已完成",
      type: "line",
      data: [] as number[],
      smooth: true,
    },
    {
      name: "待处理",
      type: "line",
      data: [] as number[],
      smooth: true,
    },
    {
      name: "处理中",
      type: "line",
      data: [] as number[],
      smooth: true,
    },
    {
      name: "已取消",
      type: "line",
      data: [] as number[],
      smooth: true,
    },
  ],
});

// 获取订单统计数据
const fetchOrderStatistics = async () => {
  try {
    const res = await getOrderView();
    if (res.data.code === 0) {
      const orderData = res.data.data;
      const dates = Object.keys(orderData).sort();

      // 更新图表数据
      orderChartOption.value.xAxis.data = dates;
      orderChartOption.value.series[0].data = dates.map(
        (date) => orderData[date].total
      );
      orderChartOption.value.series[1].data = dates.map(
        (date) => orderData[date].completed
      );
      orderChartOption.value.series[2].data = dates.map(
        (date) => orderData[date].pending
      );
      orderChartOption.value.series[3].data = dates.map(
        (date) => orderData[date].processing
      );
      orderChartOption.value.series[4].data = dates.map(
        (date) => orderData[date].canceled
      );
    }
  } catch (error) {
    console.error("获取订单统计数据失败:", error);
  }
};

// 车辆状态图表配置
const vehicleChartOption = ref({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c}辆 ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
    data: ["空闲", "运输中", "维修中"],
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
      data: [
        { value: 0, name: "空闲" },
        { value: 0, name: "运输中" },
        { value: 0, name: "维修中" },
      ],
    },
  ],
});

// 获取车辆状态数据
const fetchVehicleStatus = async () => {
  try {
    const res = await getVehicleView();
    if (res.data.code === 0) {
      const vehicleData = res.data.data;

      // 更新图表数据
      vehicleChartOption.value.series[0].data = [
        { value: vehicleData.Free || 0, name: "空闲" },
        { value: vehicleData.InTransit || 0, name: "运输中" },
        { value: vehicleData.Maintenance || 0, name: "维修中" },
      ];
    }
  } catch (error) {
    console.error("获取车辆状态数据失败:", error);
  }
};

// 线路统计图表配置
const routeChartOption = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter: (params: any) => {
      const data = params[0];
      return `${data.name}: ${data.value.toFixed(2)}公里`;
    },
  },
  legend: {
    data: ["线路里程(km)"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["常规线路", "快速线路", "特殊线路"],
  },
  yAxis: {
    type: "value",
    name: "里程(km)",
    axisLabel: {
      formatter: (value: number) => value.toFixed(2),
    },
  },
  series: [
    {
      name: "线路里程(km)",
      type: "bar",
      data: [] as { value: number; type: string }[],
      itemStyle: {
        color: function (params: any) {
          const type = params.data.type;
          const colorMap: Record<string, string> = {
            Normal: "#91c7ae", // 常规线路 - 绿色
            Quick: "#1890ff", // 快速线路 - 蓝色
            special: "#c23531", // 特殊线路 - 红色
          };
          return colorMap[type] || "#91c7ae";
        },
      },
    },
  ],
});

// 获取线路数据
const fetchRouteData = async () => {
  try {
    const res = await getRouteView();
    if (res.data.code === 0) {
      const routeData = res.data.data;

      // 更新图表数据，过滤掉 unknown 数据
      const data = [
        { value: routeData.Normal, type: "Normal" },
        { value: routeData.Quick, type: "Quick" },
        { value: routeData.special, type: "special" },
      ];

      routeChartOption.value.series[0].data = data;
    }
  } catch (error) {
    console.error("获取线路数据失败:", error);
  }
};
</script>

<style scoped>
#homeView {
  padding: 16px;
  color: #333;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.dashboard-container {
  height: calc(100vh - 96px);
  margin: 0;
}

:deep(.ant-card) {
  height: calc(50vh - 56px);
  margin-bottom: 16px;
}

:deep(.ant-card-body) {
  height: calc(100% - 57px);
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
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

.custom-info-window {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  padding: 0;
  z-index: 100;
  width: 280px;
  max-width: 90%;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  background: #f8f8f8;
  border-radius: 4px 4px 0 0;
}

.info-header h4 {
  margin: 0;
  color: #1890ff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #666;
}

.info-content {
  padding: 10px 15px;
}

.info-content p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
