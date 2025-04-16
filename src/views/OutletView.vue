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
        <a-form-item label="省份">
          <a-select
            v-model:value="searchForm.province"
            placeholder="请选择省份"
            style="width: 120px"
            @change="handleProvinceChange"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option
              v-for="province in provinceList"
              :key="province"
              :value="province"
            >
              {{ province }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="城市">
          <a-select
            v-model:value="searchForm.city"
            placeholder="请选择城市"
            style="width: 120px"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option v-for="city in cityList" :key="city" :value="city">
              {{ city }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">营业中</a-select-option>
            <a-select-option value="2">已关闭</a-select-option>
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
        <template v-if="column.key === 'detailAddress'">
          <div
            style="max-width: 200px; white-space: normal; word-break: break-all"
          >
            {{ record.detailAddress }}
          </div>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-switch
              :checked="record.status === 1"
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
            <a-form-item label="省份" name="province">
              <a-input
                v-if="outletForm.id"
                :value="outletForm.province"
                disabled
              />
              <a-select
                v-else
                v-model:value="outletForm.province"
                placeholder="请选择省份"
                @change="handleProvinceSelect"
              >
                <a-select-option
                  v-for="province in formProvinceList"
                  :key="province"
                  :value="province"
                >
                  {{ province }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="城市" name="city">
              <a-input v-if="outletForm.id" :value="outletForm.city" disabled />
              <a-select
                v-else
                v-model:value="outletForm.city"
                placeholder="请选择城市"
                @change="handleCitySelect"
              >
                <a-select-option
                  v-for="city in formCityList"
                  :key="city"
                  :value="city"
                >
                  {{ city }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="详细地址" name="detailAddress">
              <a-textarea v-model:value="outletForm.detailAddress" :rows="2" />
            </a-form-item>
            <a-form-item label="营业时间" name="businessHours">
              <a-space>
                <a-time-picker
                  v-model:value="startTime"
                  format="HH:mm"
                  placeholder="开始时间"
                  style="width: 120px"
                  @change="handleTimeChange"
                />
                <span>至</span>
                <a-time-picker
                  v-model:value="endTime"
                  format="HH:mm"
                  placeholder="结束时间"
                  style="width: 120px"
                  @change="handleTimeChange"
                />
              </a-space>
            </a-form-item>
            <a-form-item label="状态" name="status">
              <a-switch
                v-model:checked="outletForm.status"
                :checkedValue="1"
                :unCheckedValue="2"
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
          <!-- 定位按钮 -->
          <div class="locate-button-container">
            <a-button
              type="default"
              class="locate-button"
              :disabled="!outletForm.lng || !outletForm.lat"
              @click="locateToMarker"
            >
              <template #icon><environment-outlined /></template>
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons-vue";
import {
  BaiduMap,
  BmMarker,
  BmNavigation,
  BmScale,
  BmOverviewMap,
  BmLabel,
} from "vue-baidu-map-3x";
import type { TablePaginationConfig } from "ant-design-vue";
import dayjs, { Dayjs } from "dayjs";
import {
  getOutletList,
  updateOutlet,
  createOutlet,
  deleteOutlet,
  getTotalCount,
  getAllProvincesAndCities,
} from "@/api/outlet";
import { CHINA_PROVINCES } from "@/config/constants";

// 声明全局 BMap 类型
declare global {
  interface Window {
    BMap: any;
  }
}

// 搜索表单数据
const searchForm = reactive({
  name: "",
  province: "",
  city: "",
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
    title: "省份",
    dataIndex: "province",
    key: "province",
  },
  {
    title: "城市",
    dataIndex: "city",
    key: "city",
  },
  {
    title: "详细地址",
    dataIndex: "detailAddress",
    key: "detailAddress",
    width: 200,
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
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchOutletList();
  },
});

// 加载状态
const loading = ref(false);

// 省份和城市数据
const provinceList = ref<string[]>([]); // 用于搜索筛选框
const cityList = ref<string[]>([]); // 用于搜索筛选框
const formProvinceList = ref(CHINA_PROVINCES.map((province) => province.name)); // 用于添加/编辑表单
const formCityList = computed(() => {
  if (!outletForm.province) return [];
  const province = CHINA_PROVINCES.find((p) => p.name === outletForm.province);
  return province ? province.cities : [];
}); // 用于添加/编辑表单

// 获取省份和城市数据（仅用于搜索筛选框）
const fetchProvincesAndCities = async () => {
  try {
    const res = await getAllProvincesAndCities();
    if (res.data.code === 0) {
      provinceList.value = res.data.data.provinces;
      cityList.value = res.data.data.cities;
    } else {
      message.error("获取省份和城市数据失败");
    }
  } catch (error) {
    console.error("获取省份和城市数据失败:", error);
    message.error("获取省份和城市数据失败");
  }
};

// 处理省份变化（搜索筛选框）
const handleProvinceChange = async () => {
  searchForm.city = "";
  // 更新城市列表
  try {
    const res = await getAllProvincesAndCities();
    if (res.data.code === 0) {
      cityList.value = res.data.data.cities;
    }
  } catch (error) {
    console.error("获取城市数据失败:", error);
    message.error("获取城市数据失败");
  }
};

// 处理表单省份变化（添加/编辑表单）
const handleProvinceSelect = (value: string) => {
  outletForm.city = ""; // 清空城市选择
  if (baiduMapInstance.value && window.BMap) {
    try {
      // 使用 Geocoder 服务获取省份中心点
      const geocoder = new window.BMap.Geocoder();
      geocoder.getPoint(
        value,
        (point: any) => {
          if (point) {
            baiduMapInstance.value.centerAndZoom(point, 8);
            mapCenter.value = { lng: point.lng, lat: point.lat };
            mapZoom.value = 8;
          }
        },
        value
      );
    } catch (error) {
      console.error("地图操作失败:", error);
      message.error("地图操作失败，请刷新页面重试");
    }
  }
};

// 网点数据接口
interface Outlet {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  detailAddress: string;
  businessHours: string;
  lng: string;
  lat: string;
  status: number;
  remark: string;
}

const outletList = ref<Outlet[]>([]);

// 百度地图相关 - 编辑地图
const mapCenter = ref({ lng: 116.404, lat: 39.915 });
const mapZoom = ref(12);
const baiduMapInstance = ref<any>(null);

// 地图加载完成回调
const handleMapReady = ({ BMap, map }: any) => {
  baiduMapInstance.value = map;
  window.BMap = BMap;

  // 如果是编辑模式，设置地图中心点
  if (outletForm.id && outletForm.lng && outletForm.lat) {
    const point = new BMap.Point(
      parseFloat(outletForm.lng),
      parseFloat(outletForm.lat)
    );
    map.centerAndZoom(point, 15);
    mapCenter.value = {
      lng: parseFloat(outletForm.lng),
      lat: parseFloat(outletForm.lat),
    };
    mapZoom.value = 15;
  } else {
    // 默认定位到北京
    const point = new BMap.Point(116.404, 39.915);
    map.centerAndZoom(point, 12);
    mapCenter.value = { lng: 116.404, lat: 39.915 };
    mapZoom.value = 12;
  }
};

// 地图点击事件 - 选择网点位置
const handleMapClick = (e: any) => {
  if (!modalVisible.value) return;
  updateMarkerPosition(e.point);

  // 使用逆地理编码服务获取地址信息
  if (window.BMap) {
    const geocoder = new window.BMap.Geocoder();
    geocoder.getLocation(e.point, (result: any) => {
      if (result) {
        const address = result.address;
        const addressComponents = result.addressComponents;

        // 更新省份和城市
        if (addressComponents.province) {
          outletForm.province = addressComponents.province;
        }
        if (addressComponents.city) {
          outletForm.city = addressComponents.city;
        }

        // 更新详细地址
        if (address) {
          outletForm.detailAddress = address;
        }
      }
    });
  }
};

// 更新标记位置
const updateMarkerPosition = (point: any) => {
  const { lng, lat } = point;
  outletForm.lng = lng.toFixed(6);
  outletForm.lat = lat.toFixed(6);
};

// 处理标记拖动结束
const handleMarkerDragend = (e: any) => {
  updateMarkerPosition(e.point);
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
  province: "",
  city: "",
  detailAddress: "",
  businessHours: "09:00-18:00",
  lng: "",
  lat: "",
  status: 1,
  remark: "",
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入网点名称" }],
  phone: [
    { required: true, message: "请输入联系电话" },
    {
      pattern: /^0\d{2,3}-\d{7,8}$/,
      message: "请输入正确的座机号格式（如：010-12345678）",
    },
  ],
  province: [{ required: true, message: "请选择省份" }],
  city: [{ required: true, message: "请选择城市" }],
  detailAddress: [{ required: true, message: "请输入详细地址" }],
  lng: [{ required: true, message: "请选择或输入经度" }],
  lat: [{ required: true, message: "请选择或输入纬度" }],
};

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    1: "green",
    2: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    1: "营业中",
    2: "已关闭",
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
  searchForm.province = "";
  searchForm.city = "";
  searchForm.status = "";
  handleSearch();
};

// 获取网点列表
const fetchOutletList = async () => {
  loading.value = true;
  try {
    const response = await getOutletList({
      name: searchForm.name,
      status: searchForm.status ? Number(searchForm.status) : 0,
      province: searchForm.province,
      city: searchForm.city,
      skip: pagination.current - 1,
      limit: pagination.pageSize,
    });

    if (response.data.code === 0) {
      if (response.data.data && Array.isArray(response.data.data)) {
        outletList.value = response.data.data;
        // 使用获取到的数据长度作为总数
        pagination.total = response.data.data.length;
      } else {
        outletList.value = [];
        pagination.total = 0;
      }
    } else {
      message.error("获取网点列表失败");
      outletList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    message.error("获取网点列表失败");
    outletList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 表格变化处理
const handleTableChange = (pag: any) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchOutletList();
};

// 时间选择器相关
const startTime = ref<Dayjs | null>(null);
const endTime = ref<Dayjs | null>(null);

// 处理时间变化
const handleTimeChange = () => {
  if (startTime.value && endTime.value) {
    const formatTime = (time: any) => {
      return time.format("HH:mm");
    };
    outletForm.businessHours = `${formatTime(startTime.value)}-${formatTime(
      endTime.value
    )}`;
  }
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加网点";
  outletForm.id = "";
  outletForm.name = "";
  outletForm.phone = "";
  outletForm.province = "";
  outletForm.city = "";
  outletForm.detailAddress = "";
  outletForm.startTime = null;
  outletForm.endTime = null;
  outletForm.businessHours = "";
  outletForm.lng = "";
  outletForm.lat = "";
  outletForm.status = 1;
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

  // 解析营业时间
  if (record.businessHours) {
    const [start, end] = record.businessHours.split("-");
    startTime.value = dayjs(start, "HH:mm");
    endTime.value = dayjs(end, "HH:mm");
  }

  // 设置地图中心为网点位置
  mapCenter.value = {
    lng: parseFloat(record.lng),
    lat: parseFloat(record.lat),
  };
  mapZoom.value = 15;

  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    await outletFormRef.value.validate();

    // 验证联系电话格式
    const phoneRegex = /^0\d{2,3}-\d{7,8}$/;
    if (!phoneRegex.test(outletForm.phone)) {
      message.error("请输入正确的座机号格式（如：010-12345678）");
      return;
    }

    modalLoading.value = true;

    // 构造提交的数据
    const submitData = {
      ...outletForm,
      status: outletForm.status === 1 ? 1 : 2,
    };

    if (outletForm.id) {
      // 更新网点
      await updateOutlet(submitData);
      message.success("更新网点成功");
    } else {
      // 创建网点
      await createOutlet(submitData);
      message.success("创建网点成功");
    }

    modalVisible.value = false;
    fetchOutletList();
  } catch (error) {
    console.error("操作失败:", error);
    message.error(outletForm.id ? "更新网点失败" : "创建网点失败");
  } finally {
    modalLoading.value = false;
  }
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = async (record: Outlet) => {
  try {
    await deleteOutlet(record.id);
    message.success("删除成功");
    fetchOutletList();
  } catch (error) {
    message.error("删除失败");
  }
};

// 处理状态变更
const handleStatusChange = async (record: Outlet, checked: boolean) => {
  try {
    const newStatus = checked ? 1 : 2;
    await updateOutlet({
      ...record,
      status: newStatus,
    });
    message.success(`网点状态已${checked ? "开启" : "关闭"}`);
    record.status = newStatus;
  } catch (error) {
    console.error("更新状态失败:", error);
    message.error("更新状态失败");
  }
};

// 处理城市选择
const handleCitySelect = (value: string) => {
  if (baiduMapInstance.value && window.BMap) {
    try {
      // 使用 Geocoder 服务获取城市中心点
      const geocoder = new window.BMap.Geocoder();
      geocoder.getPoint(
        value,
        (point: any) => {
          if (point) {
            baiduMapInstance.value.centerAndZoom(point, 12);
            mapCenter.value = { lng: point.lng, lat: point.lat };
            mapZoom.value = 12;
          }
        },
        outletForm.province
      );
    } catch (error) {
      console.error("地图操作失败:", error);
      message.error("地图操作失败，请刷新页面重试");
    }
  }
};

// 定位到标记点
const locateToMarker = () => {
  if (!outletForm.lng || !outletForm.lat) return;

  const lng = parseFloat(outletForm.lng);
  const lat = parseFloat(outletForm.lat);

  // 更新地图中心点和缩放级别
  mapCenter.value = { lng, lat };
  mapZoom.value = 15;

  // 如果地图实例已加载，直接调用地图方法
  if (baiduMapInstance.value && window.BMap) {
    try {
      baiduMapInstance.value.setCenter(new window.BMap.Point(lng, lat));
      baiduMapInstance.value.setZoom(15);
    } catch (error) {
      console.error("地图定位失败:", error);
      message.error("地图定位失败，请刷新页面重试");
    }
  }
};

// 初始化
onMounted(() => {
  fetchOutletList();
  fetchProvincesAndCities();
});
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
  position: relative;
}

.bmap {
  flex: 1;
  width: 100%;
  height: 450px;
}

.locate-button-container {
  position: absolute;
  top: 10px;
  left: 10px;
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
