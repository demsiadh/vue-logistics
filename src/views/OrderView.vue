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
        <a-form-item label="手机号">
          <a-input
            v-model:value="searchForm.phone"
            placeholder="请输入客户手机号"
          />
        </a-form-item>
        <a-form-item label="订单状态">
          <a-select
            v-model:value="searchForm.status"
            style="width: 120px"
            placeholder="请选择状态"
          >
            <a-select-option :value="0">全部</a-select-option>
            <a-select-option :value="1">待处理</a-select-option>
            <a-select-option :value="2">处理中</a-select-option>
            <a-select-option :value="3">已完成</a-select-option>
            <a-select-option :value="4">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker
            v-model:value="searchForm.dateRange"
            :locale="zhCN"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
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
            <a-select-option :value="1">待处理</a-select-option>
            <a-select-option :value="2">处理中</a-select-option>
            <a-select-option :value="3">已完成</a-select-option>
            <a-select-option :value="4">已取消</a-select-option>
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
import dayjs from "dayjs";
import zhCN from "ant-design-vue/es/date-picker/locale/zh_CN";
import "dayjs/locale/zh-cn";
import {
  getOrderList,
  getTotalCount,
  createOrder,
  updateOrder,
  deleteOrder,
} from "@/api/order";

// 设置dayjs的默认语言
dayjs.locale("zh-cn");

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
  phone: string;
  status: number;
  dateRange: [Dayjs, Dayjs] | [];
}

const searchForm = reactive<SearchForm>({
  orderId: "",
  phone: "",
  status: 0,
  dateRange: [],
});

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm");
};

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
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: "备注",
    dataIndex: "remark",
    key: "remark",
    ellipsis: true,
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
      orderId: searchForm.orderId || "",
      phone: searchForm.phone || "",
      status: searchForm.status || 0,
      startTime: searchForm.dateRange[0]
        ? new Date(
            searchForm.dateRange[0].format("YYYY-MM-DD") + " 00:00:00 UTC"
          ).toISOString()
        : new Date("2025-01-01 00:00:00 UTC").toISOString(),
      endTime: searchForm.dateRange[1]
        ? new Date(
            searchForm.dateRange[1].format("YYYY-MM-DD") + " 23:59:59 UTC"
          ).toISOString()
        : new Date().toISOString(),
    };
    const page = {
      skip: pagination.current || 1,
      limit: pagination.pageSize || 10,
    };
    const res = await getOrderList(params, page);
    if (res.data.code === 0) {
      orderList.value = res.data.data;
    }
    getTotalCount().then((res) => {
      if (res.data.code === 0) {
        pagination.total = res.data.data;
      } else {
        message.error("获取订单总数失败");
      }
    });
  } catch (error) {
    message.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    1: "orange",
    2: "blue",
    3: "green",
    4: "red",
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    1: "待处理",
    2: "处理中",
    3: "已完成",
    4: "已取消",
  };
  return textMap[status] || "未知状态";
};

// 搜索处理
const handleSearch = () => {
  if (searchForm.phone && !/^1[3-9]\d{9}$/.test(searchForm.phone)) {
    message.error("请输入正确的手机号码");
    return;
  }
  pagination.current = 1;
  fetchOrderList();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    orderId: "",
    phone: "",
    status: 0,
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
  phone: [
    { required: true, message: "请输入联系电话" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码" },
  ],
  address: [{ required: true, message: "请输入收货地址" }],
  status: [{ required: true, message: "请选择订单状态" }],
};

// 弹窗相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref("新增订单");
const orderFormRef = ref();
const orderForm = reactive({
  orderId: "",
  customerName: "",
  phone: "",
  address: "",
  status: 1,
  remark: "",
});

// 显示新增弹窗
const showAddModal = () => {
  modalTitle.value = "新增订单";
  Object.assign(orderForm, {
    orderId: "",
    customerName: "",
    phone: "",
    address: "",
    status: 1,
    remark: "",
  });
  modalVisible.value = true;
};

// 显示编辑弹窗
const showEditModal = (record: Order) => {
  modalTitle.value = "编辑订单";
  Object.assign(orderForm, {
    orderId: record.orderId,
    customerName: record.customerName,
    phone: record.phone,
    address: record.address,
    status: record.status,
    remark: record.remark,
  });
  modalVisible.value = true;
};

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    await orderFormRef.value.validate();
    modalLoading.value = true;

    if (modalTitle.value === "新增订单") {
      const res = await createOrder(orderForm);
      if (res.data.code === 0) {
        message.success("新增订单成功");
        modalVisible.value = false;
        fetchOrderList();
      } else {
        message.error(res.data.message || "新增订单失败");
      }
    } else {
      const res = await updateOrder(orderForm);
      if (res.data.code === 0) {
        message.success("编辑订单成功");
        modalVisible.value = false;
        fetchOrderList();
      } else {
        message.error(res.data.message || "编辑订单失败");
      }
    }
  } catch (error) {
    console.error("表单验证失败:", error);
    message.error(
      modalTitle.value === "新增订单" ? "新增订单失败" : "编辑订单失败"
    );
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
    const res = await deleteOrder(record.orderId);
    if (res.data.code === 0) {
      message.success("删除成功");
      fetchOrderList();
    } else {
      message.error(res.data.message || "删除失败");
    }
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
