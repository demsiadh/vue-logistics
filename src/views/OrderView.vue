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
        <a-form-item label="订单状态">
          <a-select
            v-model:value="searchForm.status"
            style="width: 120px"
            placeholder="请选择状态"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="cancelled">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.dateRange" :locale="zhCN" />
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
        <a-form-item label="收货地址" name="address">
          <a-textarea v-model:value="orderForm.address" :rows="2" />
        </a-form-item>
        <a-form-item label="订单状态" name="status">
          <a-select v-model:value="orderForm.status">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="cancelled">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="orderForm.remark" :rows="2" />
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
import { Dayjs } from "dayjs";
import zhCN from "ant-design-vue/es/date-picker/locale/zh_CN";

// 定义订单接口
interface Order {
  id: number;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  createTime: string;
  remark: string;
}

// 搜索表单数据
interface SearchForm {
  orderId: string;
  status: string;
  dateRange: [Dayjs, Dayjs] | [];
}

const searchForm = reactive<SearchForm>({
  orderId: "",
  status: "",
  dateRange: [],
});

// 表格列定义
const columns = [
  {
    title: "订单编号",
    dataIndex: "orderId",
    key: "orderId",
  },
  {
    title: "客户名称",
    dataIndex: "customerName",
    key: "customerName",
  },
  {
    title: "联系电话",
    dataIndex: "phone",
    key: "phone",
  },
  {
    title: "收货地址",
    dataIndex: "address",
    key: "address",
    ellipsis: true,
  },
  {
    title: "订单状态",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    sorter: true,
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
    // 构建查询参数
    const params = {
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      orderId: searchForm.orderId || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.dateRange[0]?.format("YYYY-MM-DD"),
      endDate: searchForm.dateRange[1]?.format("YYYY-MM-DD"),
    };

    // TODO: 替换为实际的API调用
    // const response = await axios.get('/api/orders', { params });
    // orderList.value = response.data.list;
    // pagination.total = response.data.total;

    // 模拟数据（仅用于演示）
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockData: Order[] = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      orderId: `ORD${String(index + 1).padStart(6, "0")}`,
      customerName: `客户${index + 1}`,
      phone: `1${String(Math.floor(Math.random() * 1000000000)).padStart(
        10,
        "0"
      )}`,
      address: `北京市朝阳区某某街道第${index + 1}号`,
      status: ["pending", "processing", "completed", "cancelled"][
        Math.floor(Math.random() * 4)
      ],
      createTime: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      remark: `订单备注${index + 1}`,
    }));

    // 模拟后端筛选（实际项目中应该由后端处理）
    let filteredData = [...mockData];
    if (params.orderId) {
      filteredData = filteredData.filter((item) =>
        item.orderId.includes(params.orderId!)
      );
    }
    if (params.status) {
      filteredData = filteredData.filter(
        (item) => item.status === params.status
      );
    }
    if (params.startDate && params.endDate) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.createTime);
        const startDate = new Date(params.startDate!);
        const endDate = new Date(params.endDate!);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // 模拟分页（实际项目中应该由后端处理）
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    orderList.value = filteredData.slice(start, end);
    pagination.total = filteredData.length;
  } catch (error) {
    message.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: "orange",
    processing: "blue",
    completed: "green",
    cancelled: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return textMap[status] || status;
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
    status: "",
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
  address: [{ required: true, message: "请输入收货地址" }],
  status: [{ required: true, message: "请选择订单状态" }],
};

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("新增订单");
const orderFormRef = ref();
const orderForm = reactive<Partial<Order>>({
  customerName: "",
  phone: "",
  address: "",
  status: "pending",
  remark: "",
});

// 显示新增弹窗
const showAddModal = () => {
  modalTitle.value = "新增订单";
  Object.assign(orderForm, {
    customerName: "",
    phone: "",
    address: "",
    status: "pending",
    remark: "",
  });
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Order) => {
  modalTitle.value = "编辑订单";
  Object.assign(orderForm, record);
  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    await orderFormRef.value.validate();
    modalLoading.value = true;
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success(`${modalTitle.value}成功`);
    modalVisible.value = false;
    fetchOrderList();
  } catch (error) {
    console.error("表单验证失败:", error);
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
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success("删除成功");
    fetchOrderList();
  } catch (error) {
    message.error("删除失败");
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
</style>
