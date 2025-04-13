<template>
  <div class="user-container">
    <!-- 搜索表单 -->
    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.name" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input
            v-model:value="searchForm.phone"
            placeholder="请输入手机号"
          />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="searchForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            style="width: 120px"
            placeholder="请选择状态"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option :value="USER_STATUS.ACTIVE.VALUE">{{
              USER_STATUS.ACTIVE.NAME
            }}</a-select-option>
            <a-select-option :value="USER_STATUS.BANNED.VALUE">{{
              USER_STATUS.BANNED.NAME
            }}</a-select-option>
            <a-select-option :value="USER_STATUS.DELETED.VALUE">{{
              USER_STATUS.DELETED.NAME
            }}</a-select-option>
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
        新增用户
      </a-button>
    </div>

    <!-- 用户表格 -->
    <a-table
      :columns="columns"
      :data-source="userList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="id"
    >
      <!-- 状态列 -->
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
              title="确定要删除这个用户吗？"
              @confirm="handleDelete(record)"
            >
              <a class="danger-text">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 编辑用户弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑用户信息"
      @ok="handleUpdate"
      :confirmLoading="modalLoading"
    >
      <a-form
        :model="editForm"
        :rules="rules"
        ref="editFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="name">
          <a-input v-model:value="editForm.name" disabled />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="editForm.phone" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="editForm.email" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="editForm.status">
            <a-select-option :value="USER_STATUS.ACTIVE.VALUE">{{
              USER_STATUS.ACTIVE.NAME
            }}</a-select-option>
            <a-select-option :value="USER_STATUS.BANNED.VALUE">{{
              USER_STATUS.BANNED.NAME
            }}</a-select-option>
            <a-select-option :value="USER_STATUS.DELETED.VALUE">{{
              USER_STATUS.DELETED.NAME
            }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加用户弹窗 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="添加用户信息"
      @ok="handleAdd"
      :confirmLoading="modalLoading"
    >
      <a-form
        :model="addForm"
        :rules="addRules"
        ref="addFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="name">
          <a-input v-model:value="addForm.name" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="addForm.phone" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="addForm.email" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="addForm.password" />
        </a-form-item>
        <a-form-item label="确认密码" name="rePassword">
          <a-input-password v-model:value="addForm.rePassword" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import { USER_STATUS } from "@/config/constants";
import {
  getUserList,
  updateUser,
  createUser,
  getTotalCount,
  deleteUser,
} from "@/api/user";

// 搜索表单数据
const searchForm = reactive({
  name: "",
  email: "",
  phone: "",
  status: "",
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
  { title: "用户名", dataIndex: "name" },
  { title: "手机号", dataIndex: "phone" },
  { title: "邮箱", dataIndex: "email" },
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
const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 用户列表数据
const userList = ref([]);

// 获取用户列表数据
const fetchUserList = async () => {
  loading.value = true;
  try {
    const params = {
      name: searchForm.name,
      email: searchForm.email,
      phone: searchForm.phone,
      status: searchForm.status || USER_STATUS.ALL.VALUE,
      skip: pagination.current,
      limit: pagination.pageSize,
    };

    // 获取用户列表
    const res = await getUserList(params);
    if (res.data.code === 0) {
      userList.value = res.data.data.map((item, index) => ({
        ...item,
        id: (pagination.current - 1) * pagination.pageSize + index + 1,
      }));
    }

    // 获取总数
    const countRes = await getTotalCount();
    if (countRes.data.code === 0) {
      pagination.total = countRes.data.data;
    } else {
      message.error("获取用户总数失败");
    }
  } catch (error) {
    message.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    [USER_STATUS.ACTIVE.VALUE]: USER_STATUS.ACTIVE.COLOR,
    [USER_STATUS.BANNED.VALUE]: USER_STATUS.BANNED.COLOR,
    [USER_STATUS.DELETED.VALUE]: USER_STATUS.DELETED.COLOR,
  };
  return colorMap[status] || "default";
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    [USER_STATUS.ACTIVE.VALUE]: USER_STATUS.ACTIVE.NAME,
    [USER_STATUS.BANNED.VALUE]: USER_STATUS.BANNED.NAME,
    [USER_STATUS.DELETED.VALUE]: USER_STATUS.DELETED.NAME,
  };
  return textMap[status] || status;
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
  fetchUserList();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    email: "",
    phone: "",
    status: "",
  });
  pagination.current = 1;
  fetchUserList();
};

// 表格变化处理
const handleTableChange = (pag) => {
  if (pag.current) pagination.current = pag.current;
  if (pag.pageSize) pagination.pageSize = pag.pageSize;
  fetchUserList();
};

// 编辑模态框显示控制
const editModalVisible = ref(false);
const modalLoading = ref(false);
const editFormRef = ref();
const editForm = reactive({
  name: "",
  email: "",
  phone: "",
  status: USER_STATUS.ACTIVE.VALUE,
});

// 校验规则
const rules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "请输入有效的邮箱地址",
      trigger: "blur",
    },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入有效的手机号",
      trigger: "blur",
    },
  ],
};

// 显示编辑模态框
const showEditModal = (record) => {
  editModalVisible.value = true;
  Object.assign(editForm, record);
};

// 更新用户信息
const handleUpdate = async () => {
  try {
    await editFormRef.value.validate();
    modalLoading.value = true;
    const res = await updateUser(editForm);
    if (res.data.code === 0) {
      message.success("更新成功");
      editModalVisible.value = false;
      fetchUserList();
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    modalLoading.value = false;
  }
};

// 添加用户模态框显示控制
const addModalVisible = ref(false);
const addFormRef = ref();
const addForm = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  rePassword: "",
});

// 确认密码校验
const validateConfirmPassword = (rule, value) => {
  if (value !== addForm.password) {
    return Promise.reject("密码和确认密码不一致");
  }
  return Promise.resolve();
};

// 添加用户校验规则
const addRules = {
  name: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "请输入有效的邮箱地址",
      trigger: "blur",
    },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入有效的手机号",
      trigger: "blur",
    },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  rePassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

// 显示添加用户模态框
const showAddModal = () => {
  addModalVisible.value = true;
  Object.assign(addForm, {
    name: "",
    email: "",
    phone: "",
    password: "",
    rePassword: "",
  });
};

// 添加用户
const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    modalLoading.value = true;
    const res = await createUser(addForm);
    if (res.data.code === 0) {
      message.success("添加成功");
      addModalVisible.value = false;
      fetchUserList();
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    modalLoading.value = false;
  }
};

// 处理删除
const handleDelete = async (record) => {
  try {
    const res = await deleteUser({ name: record.name });
    if (res.data.code === 0) {
      message.success("删除成功");
      fetchUserList();
    } else {
      message.error(res.data.message || "删除失败");
    }
  } catch (error) {
    message.error("删除失败");
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchUserList();
});
</script>

<style scoped>
.user-container {
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
