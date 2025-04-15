<template>
  <div class="vehicle-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="车牌号">
          <a-input
            v-model:value="searchForm.plateNumber"
            placeholder="请输入车牌号"
          />
        </a-form-item>
        <a-form-item label="车辆类型">
          <a-select v-model:value="searchForm.type" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">货车</a-select-option>
            <a-select-option value="2">面包车</a-select-option>
            <a-select-option value="3">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="车辆状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">运行中</a-select-option>
            <a-select-option value="2">维修中</a-select-option>
            <a-select-option value="3">空闲</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="线路ID">
          <a-input
            v-model:value="searchForm.routeId"
            placeholder="请输入线路ID"
          />
        </a-form-item>
        <a-form-item label="线路名称">
          <a-input
            v-model:value="searchForm.routeName"
            placeholder="请输入线路名称"
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
        添加车辆
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="vehicleList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record._originalStatus)">
            {{ record.statusText }}
          </a-tag>
        </template>
        <template v-if="column.key === 'type'">
          {{ record.typeText }}
        </template>
        <template v-if="column.key === 'routeName'">
          {{ record.routeName || "未绑定线路" }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm
              title="确定要删除这辆车吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑车辆弹窗 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirmLoading="modalLoading"
    >
      <a-form
        :model="vehicleForm"
        :rules="formRules"
        ref="vehicleFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="车牌号" name="plateNumber">
          <a-input v-model:value="vehicleForm.plateNumber" />
        </a-form-item>
        <a-form-item label="车辆类型" name="type">
          <a-select v-model:value="vehicleForm.type">
            <a-select-option value="1">货车</a-select-option>
            <a-select-option value="2">面包车</a-select-option>
            <a-select-option value="3">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="载重量" name="loadCapacity">
          <a-input-number
            v-model:value="vehicleForm.loadCapacity"
            :min="0.1"
            :max="100"
            :precision="2"
            placeholder="请输入载重量"
            :step="0.1"
            style="width: 100%"
          />
          <span class="unit">吨</span>
        </a-form-item>
        <a-form-item label="车辆状态" name="status">
          <a-select v-model:value="vehicleForm.status">
            <a-select-option value="1">运行中</a-select-option>
            <a-select-option value="2">维修中</a-select-option>
            <a-select-option value="3">空闲</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="所属线路" name="routeId">
          <a-input
            v-model:value="vehicleForm.routeId"
            placeholder="请输入线路ID"
          />
        </a-form-item>
        <a-form-item label="备注" name="remarks">
          <a-textarea
            v-model:value="vehicleForm.remarks"
            placeholder="请输入备注信息"
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import {
  getTotalCount,
  getvehicleList,
  updatevehicle,
  deletevehicle,
  createvehicle,
} from "@/api/vehicle";

interface Point {
  lng: number;
  lat: number;
}

// 定义车辆接口
interface VehicleData {
  id: string;
  plateNumber: string;
  type: string;
  loadCapacity: number;
  status: string;
  routeId?: string; // 关联的线路ID
  routeName?: string; // 关联的线路名称
  remarks?: string; // 备注信息
  createTime?: string;
  updateTime?: string;
}

// 搜索表单数据
const searchForm = reactive({
  plateNumber: "",
  type: "",
  status: "",
  routeId: "",
  routeName: "",
});

// 表格列配置
const columns = [
  {
    title: "车牌号",
    dataIndex: "plateNumber",
    key: "plateNumber",
  },
  {
    title: "车辆类型",
    dataIndex: "typeText",
    key: "type",
  },
  {
    title: "载重量(吨)",
    dataIndex: "loadCapacity",
    key: "loadCapacity",
  },
  {
    title: "所属线路ID",
    dataIndex: "routeId",
    key: "routeId",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
  },
  {
    title: "所属线路名称",
    dataIndex: "routeName",
    key: "routeName",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
  },
  {
    title: "状态",
    dataIndex: "statusText",
    key: "status",
  },
  {
    title: "备注",
    dataIndex: "remarks",
    key: "remarks",
    customRender: ({ text }: { text: string }) => {
      return text || "-";
    },
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

// 车辆列表数据
const vehicleList = ref<VehicleData[]>([]);

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加车辆");
const vehicleFormRef = ref();
const vehicleForm = reactive<VehicleData>({
  id: "",
  plateNumber: "",
  type: "",
  loadCapacity: 0,
  status: "空闲",
  routeId: "",
  routeName: "",
  remarks: "",
});

// 表单验证规则
const formRules = {
  plateNumber: [
    { required: true, message: "请输入车牌号" },
    {
      pattern:
        /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5,6}$/,
      message: "请输入正确格式的车牌号，如：京A12345",
    },
  ],
  type: [{ required: true, message: "请选择车辆类型" }],
  loadCapacity: [
    { required: true, message: "请输入载重量" },
    { type: "number", min: 0.1, message: "载重量必须大于0" },
  ],
  status: [{ required: true, message: "请选择车辆状态" }],
};

// 获取车辆类型文本
const getVehicleTypeText = (type: string | number) => {
  const typeStr = type?.toString() || "";
  const textMap: Record<string, string> = {
    "1": "货车",
    "2": "面包车",
    "3": "皮卡",
  };
  return textMap[typeStr] || "未知";
};

// 获取车辆状态文本
const getVehicleStatusText = (status: string | number) => {
  const statusStr = status?.toString() || "";
  const textMap: Record<string, string> = {
    "1": "运行中",
    "2": "维修中",
    "3": "空闲",
  };
  return textMap[statusStr] || "未知";
};

// 获取状态颜色
const getStatusColor = (status: string | number) => {
  const statusStr = status?.toString() || "";
  const colorMap: Record<string, string> = {
    "1": "green",
    "2": "orange",
    "3": "blue",
  };
  return colorMap[statusStr] || "default";
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchVehicleList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.plateNumber = "";
  searchForm.type = "";
  searchForm.status = "";
  searchForm.routeId = "";
  searchForm.routeName = "";
  handleSearch();
};

// 获取车辆列表
const fetchVehicleList = () => {
  loading.value = true;

  // 构建查询参数
  const params = {
    plateNumber: searchForm.plateNumber,
    type: searchForm.type ? parseInt(searchForm.type) : 0, // 转换为数字
    status: searchForm.status ? parseInt(searchForm.status) : 0, // 转换为数字
    routeId: searchForm.routeId,
    routeName: searchForm.routeName,
    limit: pagination.pageSize || 10,
    skip: pagination.current || 1,
  };

  // 使用 Promise.all 等待所有请求完成
  Promise.all([getvehicleList(params), getTotalCount()])
    .then(([vehicleRes, totalRes]) => {
      if (vehicleRes.data.code === 0) {
        // 处理返回的数据，确保处理 null 或不存在的情况
        if (
          vehicleRes.data.data &&
          Array.isArray(vehicleRes.data.data) &&
          vehicleRes.data.data.length > 0
        ) {
          // 更新数据，同时转换状态和类型为中文
          vehicleList.value = vehicleRes.data.data.map((vehicle: any) => ({
            ...vehicle,
            // 保存原始值用于编辑
            _originalStatus: vehicle.status,
            _originalType: vehicle.type,
            // 转换为展示用的中文
            statusText: getVehicleStatusText(vehicle.status),
            typeText: getVehicleTypeText(vehicle.type),
          }));
        } else {
          // 如果后端返回 null 或空数组，则将列表设为空数组
          vehicleList.value = [];
          message.info("没有查询到符合条件的车辆信息");
        }
      } else {
        // 处理业务错误码
        message.error(vehicleRes.data.message || "获取车辆列表失败");
        vehicleList.value = [];
      }

      if (totalRes.data.code === 0) {
        // 更新总数，确保处理 null 的情况
        pagination.total = totalRes.data.data || 0;
      } else {
        pagination.total = 0;
      }
    })
    .catch((err) => {
      console.error("获取数据失败:", err);
      message.error("获取数据失败");
      vehicleList.value = [];
      pagination.total = 0;
    })
    .finally(() => {
      // 无论成功失败都关闭加载状态
      loading.value = false;
    });
};

// 表格变化处理
const handleTableChange = (pag: TablePaginationConfig) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchVehicleList();
};

// 显示添加弹窗
const showAddModal = () => {
  modalTitle.value = "添加车辆";
  vehicleForm.id = "";
  vehicleForm.plateNumber = "";
  vehicleForm.type = "1";
  vehicleForm.loadCapacity = 0;
  vehicleForm.status = "3";
  vehicleForm.routeId = "";
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: VehicleData) => {
  modalTitle.value = "编辑车辆";
  // 设置表单数据前，先进行类型和状态的转换
  const formData = {
    ...record,
    status: record.status?.toString(), // 确保是字符串
    type: record.type?.toString(), // 确保是字符串
  };

  // 将转换后的数据设置到表单中
  Object.assign(vehicleForm, formData);
  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = () => {
  vehicleFormRef.value.validate().then(() => {
    modalLoading.value = true;

    // 构建提交数据
    const submitData = {
      ...vehicleForm,
      loadCapacity: vehicleForm.loadCapacity.toString(), // 转换为字符串
      routeId: vehicleForm.routeId || "", // 确保 routeId 不是 undefined
      remarks: vehicleForm.remarks || "", // 确保 remarks 不是 undefined
      routeName: "", // 不再需要通过表单收集
    };

    // 根据是新增还是编辑调用不同API
    const apiCall = vehicleForm.id
      ? updatevehicle(submitData)
      : createvehicle(submitData);

    apiCall
      .then((res: any) => {
        message.success(res.message || "操作成功");
        modalVisible.value = false;
        fetchVehicleList(); // 刷新列表
      })
      .catch((err: any) => {
        console.error("操作失败:", err);
        message.error(err.message || "操作失败");
      })
      .finally(() => {
        modalLoading.value = false;
      });
  });
};

// 处理弹窗取消
const handleModalCancel = () => {
  vehicleFormRef.value?.resetFields();
  modalVisible.value = false;
};

// 处理删除
const handleDelete = (record: VehicleData) => {
  deletevehicle(record.plateNumber)
    .then((res: any) => {
      message.success(res.message || "删除成功");
      fetchVehicleList(); // 刷新列表
    })
    .catch((err: any) => {
      console.error("删除失败:", err);
      message.error(err.message || "删除失败");
    });
};

// 在组件初始化时获取数据
onMounted(() => {
  fetchVehicleList();
});
</script>

<style scoped>
.vehicle-container {
  padding: 24px;
}

.search-card {
  margin-bottom: 24px;
}

.table-operations {
  margin-bottom: 16px;
}

.unit {
  margin-left: 8px;
}

.danger-text {
  color: #ff4d4f;
}
</style>
