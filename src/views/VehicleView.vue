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
            <a-select-option value="truck">货车</a-select-option>
            <a-select-option value="van">面包车</a-select-option>
            <a-select-option value="pickup">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="车辆状态">
          <a-select v-model:value="searchForm.status" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="运行中">运行中</a-select-option>
            <a-select-option value="维修中">维修中</a-select-option>
            <a-select-option value="空闲">空闲</a-select-option>
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
          <a-tag :color="getStatusColor(record.status)">
            {{ record.status }}
          </a-tag>
        </template>
        <template v-if="column.key === 'type'">
          {{ getVehicleTypeText(record.type) }}
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
            <a-select-option value="truck">货车</a-select-option>
            <a-select-option value="van">面包车</a-select-option>
            <a-select-option value="pickup">皮卡</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="载重量" name="loadCapacity">
          <a-input-number
            v-model:value="vehicleForm.loadCapacity"
            :min="0"
            :max="100"
          />
          <span class="unit">吨</span>
        </a-form-item>
        <a-form-item label="车辆状态" name="status">
          <a-select v-model:value="vehicleForm.status">
            <a-select-option value="运行中">运行中</a-select-option>
            <a-select-option value="维修中">维修中</a-select-option>
            <a-select-option value="空闲">空闲</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import type { TablePaginationConfig } from "ant-design-vue";

// 定义车辆接口
interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  loadCapacity: number;
  status: string;
}

// 搜索表单数据
const searchForm = reactive({
  plateNumber: "",
  type: "",
  status: "",
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
    dataIndex: "type",
    key: "type",
  },
  {
    title: "载重量(吨)",
    dataIndex: "loadCapacity",
    key: "loadCapacity",
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
    width: 150,
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
const vehicleList = ref<Vehicle[]>([]);

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("添加车辆");
const vehicleFormRef = ref();
const vehicleForm = reactive<Vehicle>({
  id: "",
  plateNumber: "",
  type: "",
  loadCapacity: 0,
  status: "空闲",
});

// 表单验证规则
const formRules = {
  plateNumber: [{ required: true, message: "请输入车牌号" }],
  type: [{ required: true, message: "请选择车辆类型" }],
  loadCapacity: [{ required: true, message: "请输入载重量" }],
  status: [{ required: true, message: "请选择车辆状态" }],
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    运行中: "green",
    维修中: "orange",
    空闲: "blue",
  };
  return colorMap[status] || "default";
};

// 获取车辆类型文本
const getVehicleTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    truck: "货车",
    van: "面包车",
    pickup: "皮卡",
  };
  return textMap[type] || "未知";
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
  handleSearch();
};

// 获取车辆列表
const fetchVehicleList = () => {
  loading.value = true;
  // TODO: 实际项目中应该调用后端API获取数据

  // 模拟数据
  const mockData: Vehicle[] = [
    {
      id: "1",
      plateNumber: "京A12345",
      type: "truck",
      loadCapacity: 10,
      status: "运行中",
    },
    {
      id: "2",
      plateNumber: "京B67890",
      type: "van",
      loadCapacity: 2,
      status: "维修中",
    },
    {
      id: "3",
      plateNumber: "京C54321",
      type: "truck",
      loadCapacity: 15,
      status: "空闲",
    },
    {
      id: "4",
      plateNumber: "京D98765",
      type: "pickup",
      loadCapacity: 3,
      status: "运行中",
    },
    {
      id: "5",
      plateNumber: "京E24680",
      type: "van",
      loadCapacity: 1.5,
      status: "维修中",
    },
    {
      id: "6",
      plateNumber: "津A13579",
      type: "truck",
      loadCapacity: 8,
      status: "空闲",
    },
  ];

  // 根据筛选条件过滤数据
  let filteredData = [...mockData];

  // 车牌号模糊匹配
  if (searchForm.plateNumber) {
    filteredData = filteredData.filter((item) =>
      item.plateNumber
        .toLowerCase()
        .includes(searchForm.plateNumber.toLowerCase())
    );
  }

  // 车辆类型筛选
  if (searchForm.type) {
    filteredData = filteredData.filter((item) => item.type === searchForm.type);
  }

  // 车辆状态筛选
  if (searchForm.status) {
    filteredData = filteredData.filter(
      (item) => item.status === searchForm.status
    );
  }

  // 模拟分页（实际项目中应该由后端处理）
  const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 10);
  const end = start + (pagination.pageSize || 10);
  vehicleList.value = filteredData.slice(start, end);
  pagination.total = filteredData.length;

  setTimeout(() => {
    loading.value = false;
  }, 500);
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
  vehicleForm.type = "";
  vehicleForm.loadCapacity = 0;
  vehicleForm.status = "空闲";
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Vehicle) => {
  modalTitle.value = "编辑车辆";
  Object.assign(vehicleForm, record);
  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = () => {
  vehicleFormRef.value.validate().then(() => {
    modalLoading.value = true;
    // TODO: 调用后端API保存数据
    setTimeout(() => {
      message.success(`${modalTitle.value}成功`);
      modalVisible.value = false;
      modalLoading.value = false;
      fetchVehicleList();
    }, 500);
  });
};

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理删除
const handleDelete = (record: Vehicle) => {
  // TODO: 调用后端API删除数据
  message.success("删除成功");
  fetchVehicleList();
};

// 初始化
fetchVehicleList();
</script>

<style scoped>
.vehicle-container {
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

.unit {
  margin-left: 8px;
  color: #666;
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
