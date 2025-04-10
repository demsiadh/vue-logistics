<template>
  <div class="fence-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="围栏名称">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入围栏名称"
          />
        </a-form-item>
        <a-form-item label="状态">
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
        添加围栏
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="fenceList"
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
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-switch
              :checked="record.status === 'active'"
              @change="(checked: boolean) => handleStatusChange(record, checked)"
            />
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除这个围栏吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑围栏弹窗 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
      width="900px"
      :destroyOnClose="true"
    >
      <div class="modal-container">
        <div class="map-form-container">
          <!-- 表单部分 -->
          <a-form
            :model="fenceForm"
            :rules="formRules"
            ref="fenceFormRef"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            class="fence-form"
          >
            <a-form-item label="围栏名称" name="name">
              <a-input v-model:value="fenceForm.name" />
            </a-form-item>
            <a-form-item label="状态" name="status">
              <a-switch
                v-model:checked="fenceForm.status"
                :checkedValue="'active'"
                :unCheckedValue="'inactive'"
              />
            </a-form-item>
            <a-form-item label="备注" name="remark">
              <a-textarea v-model:value="fenceForm.remark" :rows="3" />
            </a-form-item>

            <a-divider orientation="left">围栏点位</a-divider>
            <div class="map-operation-buttons">
              <a-button
                type="primary"
                size="small"
                @click="clearPolygon"
                :disabled="polygonPoints.length === 0"
              >
                清除所有点位
              </a-button>
              <a-button
                type="primary"
                ghost
                size="small"
                @click="removeLastPoint"
                :disabled="polygonPoints.length === 0"
              >
                删除最后一个点
              </a-button>
            </div>

            <div
              class="polygon-points-container"
              v-if="polygonPoints.length > 0"
            >
              <div
                class="polygon-point-item"
                v-for="(point, index) in polygonPoints"
                :key="index"
              >
                <span class="point-index">{{ index + 1 }}</span>
                <span class="point-coords"
                  >{{ point.lng.toFixed(6) }}, {{ point.lat.toFixed(6) }}</span
                >
              </div>
            </div>
            <div class="point-info" v-else>
              <a-empty
                description="还没有添加任何点位"
                image-style="{ height: 60px }"
              />
            </div>
          </a-form>
        </div>

        <!-- 地图部分 -->
        <div class="map-container">
          <baidu-map
            class="bmap"
            :center="mapCenter"
            :zoom="mapZoom"
            :scroll-wheel-zoom="true"
            @click="handleMapClick"
            @ready="handleMapReady"
          >
            <!-- 地图控件 -->
            <bm-navigation anchor="BMAP_ANCHOR_TOP_RIGHT"></bm-navigation>
            <bm-scale anchor="BMAP_ANCHOR_BOTTOM_RIGHT"></bm-scale>
            <bm-overview-map
              anchor="BMAP_ANCHOR_BOTTOM_LEFT"
              :isOpen="true"
            ></bm-overview-map>

            <!-- 多边形围栏 -->
            <bm-polygon
              v-if="polygonPoints.length >= 3"
              :path="polygonPoints"
              stroke-color="#3388ff"
              :stroke-opacity="0.8"
              :stroke-weight="2"
              fill-color="#3388ff"
              :fill-opacity="0.3"
            ></bm-polygon>

            <!-- 点位标记 -->
            <bm-marker
              v-for="(point, index) in polygonPoints"
              :key="index"
              :position="point"
              :dragging="true"
              @dragend="(e) => handleMarkerDragend(e, index)"
            >
              <bm-label
                :content="String(index + 1)"
                :labelStyle="{
                  color: 'white',
                  backgroundColor: '#3388ff',
                  border: '0',
                  padding: '2px 4px',
                  fontSize: '12px',
                  borderRadius: '2px',
                }"
                :offset="{ width: 0, height: -25 }"
              />
            </bm-marker>
          </baidu-map>
          <div class="map-tip">
            <a-alert type="info" show-icon>
              <template #message
                >在地图上点击添加围栏点位，至少需要3个点位才能形成有效围栏</template
              >
            </a-alert>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import {
  BaiduMap,
  BmMarker,
  BmPolygon,
  BmNavigation,
  BmScale,
  BmOverviewMap,
  BmLabel,
} from "vue-baidu-map-3x";
import type { TablePaginationConfig } from "ant-design-vue";

// 搜索表单数据
const searchForm = reactive({
  name: "",
  status: "",
});

// 表格列配置
const columns = [
  {
    title: "围栏名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "围栏类型",
    dataIndex: "type",
    key: "type",
    customRender: ({ text }: { text: string }) => "多边形",
  },
  {
    title: "点位数",
    dataIndex: "points",
    key: "points",
    customRender: ({ text }: { text: any[] }) => `${text?.length || 0}个点位`,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
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
  showTotal: (total: number) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 围栏列表数据
interface Point {
  lng: number;
  lat: number;
}

interface Fence {
  id: string;
  name: string;
  type: string;
  points: Point[];
  status: string;
  remark: string;
}

const fenceList = ref<Fence[]>([]);

// 百度地图相关
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const BMap = ref<any>(null);
const polygonPoints = ref<Point[]>([]);

// 地图加载完成回调
const handleMapReady = ({ BMap: bmap, map }: any) => {
  BMap.value = bmap;
};

// 地图点击事件 - 添加多边形点位
const handleMapClick = (e: any) => {
  const { lng, lat } = e.point;

  // 添加点到多边形
  polygonPoints.value.push({
    lng: parseFloat(lng.toFixed(6)),
    lat: parseFloat(lat.toFixed(6)),
  });
};

// 更新多边形点位（拖拽结束）
const updatePolygonPoint = (
  e: { point: { lng: number; lat: number } },
  index: number
) => {
  const { lng, lat } = e.point;

  if (index >= 0 && index < polygonPoints.value.length) {
    polygonPoints.value[index] = {
      lng: parseFloat(lng.toFixed(6)),
      lat: parseFloat(lat.toFixed(6)),
    };
  }
};

// 处理标记拖动结束
const handleMarkerDragend = (e: any, index: number) => {
  updatePolygonPoint(e, index);
};

// 清除所有点位
const clearPolygon = () => {
  polygonPoints.value = [];
};

// 删除最后一个点
const removeLastPoint = () => {
  polygonPoints.value.pop();
};

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加围栏");
const fenceFormRef = ref();
const fenceForm = reactive<any>({
  id: "",
  name: "",
  type: "polygon",
  status: "active",
  remark: "",
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入围栏名称" }],
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

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchFenceList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = "";
  searchForm.status = "";
  handleSearch();
};

// 获取围栏列表
const fetchFenceList = () => {
  loading.value = true;
  // TODO: 调用后端API获取数据
  setTimeout(() => {
    fenceList.value = [
      {
        id: "1",
        name: "仓库A区域围栏",
        type: "polygon",
        points: [
          { lng: 116.403, lat: 39.915 },
          { lng: 116.41, lat: 39.917 },
          { lng: 116.415, lat: 39.91 },
          { lng: 116.405, lat: 39.907 },
        ],
        status: "active",
        remark: "仓库A区域围栏范围",
      },
      {
        id: "2",
        name: "配送网点B区域",
        type: "polygon",
        points: [
          { lng: 116.433, lat: 39.935 },
          { lng: 116.443, lat: 39.937 },
          { lng: 116.453, lat: 39.93 },
          { lng: 116.443, lat: 39.927 },
          { lng: 116.433, lat: 39.932 },
        ],
        status: "inactive",
        remark: "配送网点B区域围栏",
      },
    ];
    pagination.total = 2;
    loading.value = false;
  }, 500);
};

// 表格变化处理
const handleTableChange = (pag: any) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchFenceList();
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加围栏";
  fenceForm.id = "";
  fenceForm.name = "";
  fenceForm.type = "polygon";
  fenceForm.status = "active";
  fenceForm.remark = "";

  // 清空多边形点位
  polygonPoints.value = [];

  // 重置地图中心到北京
  mapCenter.value = { lng: 116.404, lat: 39.915 };
  mapZoom.value = 12;

  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Fence) => {
  modalTitle.value = "编辑围栏";

  // 清空当前点位
  polygonPoints.value = [];

  // 深拷贝记录数据
  const recordCopy = JSON.parse(JSON.stringify(record));
  Object.assign(fenceForm, recordCopy);

  // 加载围栏点位
  if (record.points && record.points.length > 0) {
    // 确保将字符串格式的经纬度转换为数字
    polygonPoints.value = record.points.map((point) => ({
      lng: typeof point.lng === "string" ? parseFloat(point.lng) : point.lng,
      lat: typeof point.lat === "string" ? parseFloat(point.lat) : point.lat,
    }));

    // 计算多边形中心点作为地图中心
    const lngSum = polygonPoints.value.reduce(
      (sum, point) => sum + point.lng,
      0
    );
    const latSum = polygonPoints.value.reduce(
      (sum, point) => sum + point.lat,
      0
    );
    const count = polygonPoints.value.length;

    mapCenter.value = {
      lng: lngSum / count,
      lat: latSum / count,
    };

    // 根据多边形大小适当调整缩放级别
    mapZoom.value = 14;
  }

  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = () => {
  fenceFormRef.value.validate().then(() => {
    if (polygonPoints.value.length < 3) {
      message.error("请至少添加3个点位组成有效围栏");
      return;
    }

    modalLoading.value = true;

    // 构造提交的数据
    const submitData = {
      ...fenceForm,
      points: polygonPoints.value.map((point) => ({
        lng: point.lng,
        lat: point.lat,
      })),
    };

    // TODO: 调用后端API保存数据
    console.log("提交的围栏数据:", submitData);

    setTimeout(() => {
      message.success(`${modalTitle.value}成功`);
      modalVisible.value = false;
      modalLoading.value = false;
      fetchFenceList();
    }, 500);
  });
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = (record: Fence) => {
  // TODO: 调用后端API删除数据
  message.success("删除成功");
  fetchFenceList();
};

// 处理状态变更
const handleStatusChange = (record: Fence, checked: boolean) => {
  const newStatus = checked ? "active" : "inactive";
  // TODO: 调用后端API更新状态
  message.success(`围栏状态已${checked ? "启用" : "禁用"}`);
  record.status = newStatus;
};

// 初始化
fetchFenceList();
</script>

<style scoped>
.fence-container {
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

.modal-container {
  display: flex;
  flex-direction: row;
  height: 500px;
}

.map-form-container {
  flex: 0 0 300px;
  padding-right: 16px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
}

.fence-form {
  padding-right: 10px;
}

.map-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 16px;
}

.bmap {
  flex: 1;
  width: 100%;
  height: 450px;
}

.map-tip {
  margin-top: 10px;
}

.map-operation-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.polygon-points-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 16px;
}

.polygon-point-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #f9f9f9;
}

.polygon-point-item:last-child {
  border-bottom: none;
}

.point-index {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #3388ff;
  color: white;
  border-radius: 50%;
  margin-right: 10px;
  font-size: 12px;
}

.point-coords {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.point-info {
  margin: 20px 0;
  text-align: center;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
