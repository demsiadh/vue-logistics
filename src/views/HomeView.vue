<template>
  <div id="homeView">
    <div class="header">
      <h1>欢迎来到领运物流管理系统</h1>
      <p>基于百度地图API的高效物流解决方案</p>
    </div>
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
    <div class="stats">
      <div class="stat-item">
        <h2>订单数量</h2>
        <p>{{ orderCount }}</p>
      </div>
      <div class="stat-item">
        <h2>车辆数量</h2>
        <p>{{ vehicleCount }}</p>
      </div>
      <div class="stat-item">
        <h2>仓库数量</h2>
        <p>{{ warehouseCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { BaiduMap, BmMarker, BmInfoWindow } from "vue-baidu-map-3x";

const router = useRouter();

// 地图中心点
const center = ref({ lng: 116.404, lat: 39.915 });
const zoom = ref(15);

// 信息窗口内容
const infoWindowTitle = ref("北京总部");
const infoWindowContent = ref("这里是领运物流的总部");

// 统计数据
const orderCount = ref(1234);
const vehicleCount = ref(56);
const warehouseCount = ref(10);
</script>

<style scoped>
#homeView {
  padding: 20px;
  color: #333;
}

.header {
  text-align: center;
  margin-top: 70px;
  margin-bottom: 20px;
  background: #f5f5f5;
}

.map-container {
  width: 100%;
  height: 400px;
  margin-bottom: 20px;
  overflow: hidden; /* 防止地图超出容器 */
}

.bmap {
  width: 100%;
  height: 100%;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  background-color: #f0f2f5;
  padding: 20px;
  border-radius: 8px;
}
</style>
