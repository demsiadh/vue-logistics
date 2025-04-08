<template>
  <div class="user-management">
    <!-- 增强版查询表单 -->
    <a-form
      :model="queryParams"
      layout="inline"
      class="search-form"
      @finish="handleSearch"
    >
      <a-row :gutter="24">
        <!-- 用户名 -->
        <a-col :span="6">
          <a-form-item label="用户名" name="username">
            <a-input
              v-model:value="queryParams.username"
              placeholder="支持模糊查询"
            />
          </a-form-item>
        </a-col>

        <!-- 邮箱 -->
        <a-col :span="6">
          <a-form-item label="邮箱" name="email">
            <a-input
              v-model:value="queryParams.email"
              placeholder="完整邮箱地址"
            />
          </a-form-item>
        </a-col>

        <!-- 手机号 -->
        <a-col :span="6">
          <a-form-item label="手机号" name="phone">
            <a-input
              v-model:value="queryParams.phone"
              placeholder="支持部分号码"
            />
          </a-form-item>
        </a-col>

        <!-- 状态选择（4种状态） -->
        <a-col :span="6">
          <a-form-item label="状态" name="status">
            <a-select
              v-model:value="queryParams.status"
              placeholder="全部状态"
              allow-clear
            >
              <a-select-option :value="undefined">全部</a-select-option>
              <a-select-option :value="0">已禁用</a-select-option>
              <a-select-option :value="1">已启用</a-select-option>
              <a-select-option :value="2">待审核</a-select-option>
              <a-select-option :value="3">已过期</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <!-- 注册时间范围 -->
        <a-col :span="8">
          <a-form-item label="注册时间" name="dateRange">
            <a-range-picker
              v-model:value="queryParams.dateRange"
              :disabled-date="disabledDate"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>

        <!-- 操作按钮 -->
        <a-col :span="4" class="action-col">
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset"
            >重置</a-button
          >
        </a-col>
      </a-row>
    </a-form>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="pagination"
      row-key="id"
      bordered
      style="margin-top: 10px"
      <!--
      减少表格与筛选框之间的距离
      --
    >
      >
      <!-- 序号列 -->
      <template #index="{ index }">
        {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
      </template>

      <!-- 状态显示 -->
      <template #status="{ text }">
        <a-tag :color="statusColors[text]">
          {{ statusLabels[text] }}
        </a-tag>
      </template>

      <!-- 操作列 -->
      <template #action="{ record }">
        <a-button type="link" @click="showEditModal(record)">编辑</a-button>
        <a-button
          type="link"
          danger
          @click="handleDelete(record.id)"
          :disabled="record.status === 2"
        >
          删除
        </a-button>
      </template>
    </a-table>

    <!-- 用户编辑弹窗 -->
    <!-- 保持原有结构，修改状态选项 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { message, Modal } from "ant-design-vue";

// 状态配置
const statusLabels = {
  0: "已禁用",
  1: "已启用",
  2: "待审核",
  3: "已过期",
};

const statusColors = {
  0: "red",
  1: "green",
  2: "orange",
  3: "purple",
};

// 增强版示例数据
const mockData = Array.from({ length: 100 }).map((_, i) => ({
  id: i + 1,
  username: `用户_${String(i + 1).padStart(3, "0")}`,
  email: `user${i + 1}@example.com`,
  phone: `138${String(i).padStart(4, "0").slice(-4)}5678`,
  status: i % 4, // 生成0-3的状态
  createTime: new Date(Date.now() - i * 86400000).toISOString(), // 生成过去100天的日期
}));

// 查询参数
const queryParams = reactive({
  username: "",
  email: "",
  phone: "",
  status: undefined,
  dateRange: [],
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: computed(() => filteredData.value.length),
  showSizeChanger: true,
});

// 表格列配置
const columns = [
  {
    title: "序号",
    key: "index",
    width: 80,
    customRender: ({ index }) =>
      (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  { title: "用户名", dataIndex: "username" },
  { title: "邮箱", dataIndex: "email" },
  { title: "手机号", dataIndex: "phone" },
  {
    title: "状态",
    dataIndex: "status",
    slots: { customRender: "status" },
  },
  {
    title: "注册时间",
    dataIndex: "createTime",
    customRender: ({ text }) => new Date(text).toLocaleDateString(),
  },
  {
    title: "操作",
    slots: { customRender: "action" },
    width: 150,
  },
];

// 数据过滤逻辑
const filteredData = computed(() => {
  return mockData.filter((item) => {
    // 用户名模糊匹配
    const usernameMatch = item.username
      .toLowerCase()
      .includes(queryParams.username.toLowerCase());

    // 邮箱精确匹配
    const emailMatch = queryParams.email
      ? item.email === queryParams.email
      : true;

    // 手机号部分匹配
    const phoneMatch = queryParams.phone
      ? item.phone.includes(queryParams.phone)
      : true;

    // 状态筛选
    const statusMatch =
      queryParams.status !== undefined
        ? item.status === queryParams.status
        : true;

    // 日期范围筛选
    const dateMatch =
      queryParams.dateRange?.length === 2
        ? new Date(item.createTime) >= queryParams.dateRange[0] &&
          new Date(item.createTime) <= queryParams.dateRange[1]
        : true;

    return (
      usernameMatch && emailMatch && phoneMatch && statusMatch && dateMatch
    );
  });
});

// 其他方法保持原有逻辑，需要调整状态修改逻辑：
const handleStatusChange = (id, newStatus) => {
  Modal.confirm({
    title: "确认修改状态吗？",
    content: "请谨慎操作状态变更",
    onOk: () => {
      const user = mockData.find((item) => item.id === id);
      user.status = newStatus;
      message.success("状态修改成功");
    },
  });
};
</script>

<style>
/* 状态标签样式 */
.ant-tag {
  margin-right: 0;
  cursor: pointer;
  transition: all 0.3s;
}

.ant-tag:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* 确保表格和表单不超出宽度 */
.user-management {
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.search-form {
  width: 100%;
  margin-bottom: 20px;
}

.ant-row {
  width: 100%;
  margin: 0;
}

.ant-col {
  box-sizing: border-box;
}

/* 添加 a-form-item 之间的垂直间距 */
.search-form .ant-form-item {
  margin-bottom: 16px;
}

/* 降低表格每行的高度 */
.ant-table-tbody > tr > td {
  padding: 8px 16px; /* 减少单元格内边距 */
}

.ant-table-thead > tr > th {
  padding: 8px 16px; /* 减少表头内边距 */
}
</style>
