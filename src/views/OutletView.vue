<template>
  <div class="outlet-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="网点名称">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入网点名称"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="active">营业中</a-select-option>
            <a-select-option value="inactive">已关闭</a-select-option>
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
        添加网点
      </a-button>
      <a-button @click="showMapView" style="margin-left: 8px">
        <template #icon><environment-outlined /></template>
        地图查看
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="outletList"
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
        <template v-if="column.key === 'address'">
          <div
            style="max-width: 250px; white-space: normal; word-break: break-all"
          >
            {{ record.address }}
          </div>
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
              title="确定要删除这个网点吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑网点弹窗 -->
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
        <div class="form-container">
          <!-- 表单部分 -->
          <a-form
            :model="outletForm"
            :rules="formRules"
            ref="outletFormRef"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
            class="outlet-form"
          >
            <a-form-item label="网点名称" name="name">
              <a-input v-model:value="outletForm.name" />
            </a-form-item>
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="outletForm.phone" />
            </a-form-item>
            <a-form-item label="详细地址" name="address">
              <a-textarea v-model:value="outletForm.address" :rows="2" />
            </a-form-item>
            <a-form-item label="营业时间" name="businessHours">
              <a-input
                v-model:value="outletForm.businessHours"
                placeholder="例如：09:00-18:00"
              />
            </a-form-item>
            <a-form-item label="状态" name="status">
              <a-switch
                v-model:checked="outletForm.status"
                :checkedValue="'active'"
                :unCheckedValue="'inactive'"
              />
            </a-form-item>
            <a-form-item label="备注" name="remark">
              <a-textarea v-model:value="outletForm.remark" :rows="2" />
            </a-form-item>
            <a-divider orientation="left">位置信息</a-divider>
            <a-alert
              type="info"
              message="在地图上点击选择网点位置，或者直接输入经纬度"
              style="margin-bottom: 16px"
            />
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="经度" name="lng">
                  <a-input v-model:value="outletForm.lng" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="纬度" name="lat">
                  <a-input v-model:value="outletForm.lat" />
                </a-form-item>
              </a-col>
            </a-row>
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

            <!-- 网点标记 -->
            <bm-marker
              v-if="outletForm.lng && outletForm.lat"
              :position="{
                lng: parseFloat(outletForm.lng),
                lat: parseFloat(outletForm.lat),
              }"
              :dragging="true"
              @dragend="handleMarkerDragend"
            >
              <bm-label
                :content="outletForm.name || '新网点'"
                :labelStyle="{
                  color: 'white',
                  backgroundColor: '#1890ff',
                  border: '0',
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '2px',
                }"
                :offset="{ width: 0, height: -30 }"
              />
            </bm-marker>
          </baidu-map>
        </div>
      </div>
    </a-modal>

    <!-- 地图查看弹窗 -->
    <a-modal
      title="网点地图查看"
      v-model:visible="mapViewVisible"
      @cancel="closeMapView"
      @ok="closeMapView"
      width="900px"
      :footer="null"
      :destroyOnClose="true"
      :maskClosable="true"
      :afterClose="handleMapModalAfterClose"
    >
      <div style="height: 550px; position: relative" v-if="mapViewVisible">
        <div v-show="mapViewVisible" class="map-view-container">
          <baidu-map
            class="bmap-full"
            :center="viewMapCenter"
            :zoom="viewMapZoom"
            :scroll-wheel-zoom="true"
            @ready="handleViewMapReady"
          >
            <!-- 地图控件 -->
            <bm-navigation anchor="BMAP_ANCHOR_TOP_RIGHT"></bm-navigation>
            <bm-scale anchor="BMAP_ANCHOR_BOTTOM_RIGHT"></bm-scale>
            <bm-overview-map
              anchor="BMAP_ANCHOR_BOTTOM_LEFT"
              :isOpen="true"
            ></bm-overview-map>

            <!-- 网点标记 -->
            <bm-marker
              v-for="outlet in outletList"
              :key="outlet.id"
              :position="{
                lng: parseFloat(outlet.lng),
                lat: parseFloat(outlet.lat),
              }"
              @click="selectOutlet(outlet.id)"
            >
              <bm-label
                :content="outlet.name"
                :labelStyle="{
                  color: 'white',
                  backgroundColor:
                    outlet.status === 'active' ? '#52c41a' : '#ff4d4f',
                  border: '0',
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '2px',
                }"
                :offset="{ width: 0, height: -30 }"
              />
              <bm-info-window :show="outlet.id === selectedOutletId">
                <div style="width: 250px">
                  <h3>{{ outlet.name }}</h3>
                  <p><strong>地址：</strong>{{ outlet.address }}</p>
                  <p><strong>电话：</strong>{{ outlet.phone }}</p>
                  <p><strong>营业时间：</strong>{{ outlet.businessHours }}</p>
                  <p>
                    <strong>状态：</strong>{{ getStatusText(outlet.status) }}
                  </p>
                </div>
              </bm-info-window>
            </bm-marker>
          </baidu-map>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons-vue";
import {
  BaiduMap,
  BmMarker,
  BmInfoWindow,
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
    title: "网点名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "联系电话",
    dataIndex: "phone",
    key: "phone",
  },
  {
    title: "详细地址",
    dataIndex: "address",
    key: "address",
  },
  {
    title: "营业时间",
    dataIndex: "businessHours",
    key: "businessHours",
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

// 网点数据接口
interface Outlet {
  id: string;
  name: string;
  phone: string;
  address: string;
  businessHours: string;
  lng: string;
  lat: string;
  status: string;
  remark: string;
}

const outletList = ref<Outlet[]>([]);
const selectedOutletId = ref<string>("");

// 百度地图相关 - 编辑地图
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const baiduMapInstance = ref<any>(null);

// 百度地图相关 - 查看地图
const viewMapCenter = ref({ lng: 116.404, lat: 39.915 });
const viewMapZoom = ref(11);
const viewMapInstance = ref<any>(null);

// 地图加载完成回调 - 编辑地图
const handleMapReady = ({ BMap, map }: any) => {
  baiduMapInstance.value = map;
};

// 地图加载完成回调 - 查看地图
const handleViewMapReady = ({ BMap, map }: any) => {
  viewMapInstance.value = map;
};

// 地图点击事件 - 选择网点位置
const handleMapClick = (e: any) => {
  if (!modalVisible.value) return;

  const { lng, lat } = e.point;
  outletForm.lng = lng.toFixed(6);
  outletForm.lat = lat.toFixed(6);
};

// 处理标记拖动结束
const handleMarkerDragend = (e: any) => {
  const { lng, lat } = e.point;
  outletForm.lng = lng.toFixed(6);
  outletForm.lat = lat.toFixed(6);
};

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加网点");
const outletFormRef = ref();
const outletForm = reactive<any>({
  id: "",
  name: "",
  phone: "",
  address: "",
  businessHours: "09:00-18:00",
  lng: "",
  lat: "",
  status: "active",
  remark: "",
});

// 地图查看弹窗
const mapViewVisible = ref(false);

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入网点名称" }],
  phone: [{ required: true, message: "请输入联系电话" }],
  address: [{ required: true, message: "请输入详细地址" }],
  lng: [{ required: true, message: "请选择或输入经度" }],
  lat: [{ required: true, message: "请选择或输入纬度" }],
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
    active: "营业中",
    inactive: "已关闭",
  };
  return textMap[status] || "未知";
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchOutletList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = "";
  searchForm.status = "";
  handleSearch();
};

// 获取网点列表
const fetchOutletList = () => {
  loading.value = true;

  // 模拟后端API调用，实现筛选功能
  // 假数据集
  const mockData = [
    {
      id: "1",
      name: "北京朝阳网点",
      phone: "010-12345678",
      address: "北京市朝阳区建国路88号",
      businessHours: "09:00-18:00",
      lng: "116.4716",
      lat: "39.9336",
      status: "active",
      remark: "朝阳区主要营业网点",
    },
    {
      id: "2",
      name: "北京海淀网点",
      phone: "010-87654321",
      address: "北京市海淀区中关村大街1号",
      businessHours: "08:30-18:30",
      lng: "116.3276",
      lat: "39.9846",
      status: "active",
      remark: "海淀区主要营业网点",
    },
    {
      id: "3",
      name: "上海浦东网点",
      phone: "021-12345678",
      address: "上海市浦东新区陆家嘴环路1000号",
      businessHours: "09:00-18:00",
      lng: "121.5174",
      lat: "31.2337",
      status: "active",
      remark: "浦东新区主要营业网点",
    },
    {
      id: "4",
      name: "广州天河网点",
      phone: "020-12345678",
      address: "广州市天河区天河路385号",
      businessHours: "09:30-18:30",
      lng: "113.3345",
      lat: "23.1375",
      status: "active",
      remark: "天河区主要营业网点",
    },
    {
      id: "5",
      name: "深圳南山网点",
      phone: "0755-12345678",
      address: "深圳市南山区科技园科发路8号",
      businessHours: "09:00-19:00",
      lng: "113.9544",
      lat: "22.5377",
      status: "inactive",
      remark: "南山区主要营业网点",
    },
    {
      id: "6",
      name: "杭州西湖网点",
      phone: "0571-12345678",
      address: "杭州市西湖区西湖文化广场",
      businessHours: "09:00-18:00",
      lng: "120.1536",
      lat: "30.2761",
      status: "active",
      remark: "西湖区主要营业网点",
    },
    {
      id: "7",
      name: "成都锦江网点",
      phone: "028-12345678",
      address: "成都市锦江区红星路三段1号",
      businessHours: "09:30-18:30",
      lng: "104.0879",
      lat: "30.6598",
      status: "inactive",
      remark: "锦江区主要营业网点",
    },
  ];

  // 应用筛选条件
  let filteredData = [...mockData];

  // 按名称筛选
  if (searchForm.name) {
    filteredData = filteredData.filter((item) =>
      item.name.toLowerCase().includes(searchForm.name.toLowerCase())
    );
  }

  // 按状态筛选
  if (searchForm.status) {
    filteredData = filteredData.filter(
      (item) => item.status === searchForm.status
    );
  }

  // 分页处理
  const startIndex =
    ((pagination.current || 1) - 1) * (pagination.pageSize || 10);
  const endIndex = startIndex + (pagination.pageSize || 10);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 更新总条数
  pagination.total = filteredData.length;

  // 模拟后端延迟
  setTimeout(() => {
    outletList.value = paginatedData;
    loading.value = false;
  }, 500);
};

// 表格变化处理
const handleTableChange = (pag: any) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchOutletList();
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加网点";
  outletForm.id = "";
  outletForm.name = "";
  outletForm.phone = "";
  outletForm.address = "";
  outletForm.businessHours = "09:00-18:00";
  outletForm.lng = "";
  outletForm.lat = "";
  outletForm.status = "active";
  outletForm.remark = "";

  // 重置地图中心到北京
  mapCenter.value = { lng: 116.404, lat: 39.915 };
  mapZoom.value = 12;

  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Outlet) => {
  modalTitle.value = "编辑网点";

  // 深拷贝记录数据
  const recordCopy = JSON.parse(JSON.stringify(record));
  Object.assign(outletForm, recordCopy);

  // 设置地图中心为网点位置
  mapCenter.value = {
    lng: parseFloat(record.lng),
    lat: parseFloat(record.lat),
  };
  mapZoom.value = 15;

  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = () => {
  outletFormRef.value.validate().then(() => {
    modalLoading.value = true;

    // 构造提交的数据
    const submitData = { ...outletForm };

    // 模拟调用后端API
    console.log("提交的网点数据:", submitData);

    setTimeout(() => {
      message.success(`${modalTitle.value}成功`);
      modalVisible.value = false;
      modalLoading.value = false;
      fetchOutletList();
    }, 500);
  });
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = (record: Outlet) => {
  // 模拟调用后端API删除数据
  message.success("删除成功");
  fetchOutletList();
};

// 处理状态变更
const handleStatusChange = (record: Outlet, checked: boolean) => {
  const newStatus = checked ? "active" : "inactive";
  // 模拟调用后端API更新状态
  message.success(`网点状态已${checked ? "开启" : "关闭"}`);
  record.status = newStatus;
};

// 选择网点，显示信息窗口
const selectOutlet = (id: string) => {
  selectedOutletId.value = id;
};

// 显示地图查看
const showMapView = () => {
  // 计算地图中心点和缩放级别
  if (outletList.value.length > 0) {
    // 简单方法：使用第一个网点的位置作为中心
    const firstOutlet = outletList.value[0];
    viewMapCenter.value = {
      lng: parseFloat(firstOutlet.lng),
      lat: parseFloat(firstOutlet.lat),
    };
  }

  // 重置选中的网点
  selectedOutletId.value = "";

  // 显示地图
  mapViewVisible.value = true;
};

// 关闭地图查看
const closeMapView = () => {
  mapViewVisible.value = false;
  selectedOutletId.value = "";
};

// 模态框完全关闭后的回调
const handleMapModalAfterClose = () => {
  // 确保完全销毁地图实例
  if (viewMapInstance.value) {
    viewMapInstance.value = null;
    // 强制触发DOM更新
    nextTick(() => {
      console.log("Map instance destroyed");
    });
  }
};

// 初始化
fetchOutletList();
</script>

<style scoped>
.outlet-container {
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

.form-container {
  flex: 0 0 300px;
  padding-right: 16px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
}

.outlet-form {
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

.bmap-full {
  width: 100%;
  height: 100%;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

.map-view-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}
</style>
