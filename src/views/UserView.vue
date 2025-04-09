<template>
  <div id="user-management">
    <!-- 增强版查询表单 -->
    <a-form :model="queryParams" layout="inline" class="search-form">
      <a-row :gutter="24">
        <!-- 用户名 -->
        <a-col :span="6">
          <a-form-item label="用户名" name="name">
            <a-input
              v-model:value="queryParams.name"
              placeholder="支持模糊查询"
            />
          </a-form-item>
        </a-col>

        <!-- 邮箱 -->
        <a-col :span="6">
          <a-form-item label="邮箱" name="email">
            <a-input
              v-model:value="queryParams.email"
              placeholder="支持模糊查询"
            />
          </a-form-item>
        </a-col>

        <!-- 手机号 -->
        <a-col :span="6">
          <a-form-item label="手机号" name="phone">
            <a-input
              v-model:value="queryParams.phone"
              placeholder="支持模糊查询"
            />
          </a-form-item>
        </a-col>

        <a-col :span="6">
          <a-form-item label="状态" name="status">
            <a-select
              v-model:value="queryParams.status"
              placeholder="全部状态"
              allow-clear
            >
              <a-select-option :value="USER_STATUS.ALL.VALUE"
                >全部
              </a-select-option>
              <a-select-option :value="USER_STATUS.ACTIVE.VALUE"
                >{{ USER_STATUS.ACTIVE.NAME }}
              </a-select-option>
              <a-select-option :value="USER_STATUS.BANNED.VALUE"
                >{{ USER_STATUS.BANNED.NAME }}
              </a-select-option>
              <a-select-option :value="USER_STATUS.DELETED.VALUE"
                >{{ USER_STATUS.DELETED.NAME }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <!-- 操作按钮 -->
        <a-col :span="6" class="action-col">
          <a-button
            type="primary"
            html-type="submit"
            @click="getUserListByParams"
            >查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset"
            >重置
          </a-button>
          <a-button style="margin-left: 8px" @click="showAddModal"
            >添加用户
          </a-button>
        </a-col>
      </a-row>
    </a-form>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="mockData"
      :pagination="pagination"
      row-key="id"
      bordered
      style="margin-top: 10px"
      @change="handleTableChange"
    >
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
      </template>
    </a-table>

    <!-- 编辑模态框 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑用户信息"
      @ok="handleUpdate"
    >
      <a-form
        :model="editForm"
        :rules="rules"
        ref="editFormRef"
        layout="vertical"
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
          <a-select v-model:value="editForm.status" placeholder="请选择状态">
            <a-select-option :value="USER_STATUS.ACTIVE.VALUE"
              >{{ USER_STATUS.ACTIVE.NAME }}
            </a-select-option>
            <a-select-option :value="USER_STATUS.BANNED.VALUE"
              >{{ USER_STATUS.BANNED.NAME }}
            </a-select-option>
            <a-select-option :value="USER_STATUS.DELETED.VALUE"
              >{{ USER_STATUS.DELETED.NAME }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加用户模态框 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="添加用户信息"
      @ok="handleAdd"
    >
      <a-form
        :model="addForm"
        :rules="addRules"
        ref="addFormRef"
        layout="vertical"
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
import { USER_STATUS } from "@/config/constants";
import { getUserList, updateUser, createUser, getTotalCount } from "@/api/user";

// 状态配置
const statusLabels = {
  1: USER_STATUS.ACTIVE.NAME,
  2: USER_STATUS.BANNED.NAME,
  3: USER_STATUS.DELETED.NAME,
};

const statusColors = {
  1: USER_STATUS.ACTIVE.COLOR,
  2: USER_STATUS.BANNED.COLOR,
  3: USER_STATUS.DELETED.COLOR,
};

// 初始化 mockData 为空数组
const mockData = ref([]);

// 查询参数
const queryParams = reactive({
  name: "",
  email: "",
  phone: "",
  status: USER_STATUS.ALL.VALUE,
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  total: 0,
  showTotal: (total) => `共 ${total} 条`,
  pageSizeOptions: ["10", "20", "50", "100"],
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
    slots: { customRender: "status" },
  },
  {
    title: "操作",
    slots: { customRender: "action" },
    width: 150,
  },
];

// 编辑模态框显示控制
const editModalVisible = ref(false);
const editForm = reactive({
  name: "",
  email: "",
  phone: "",
  status: 0,
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
  // 将状态的数字值转换为对应的中文名称
  const statusName = statusLabels[record.status];
  Object.assign(editForm, {
    ...record,
    status: statusName,
  });
};

// 更新用户信息
const handleUpdate = () => {
  // 校验表单
  editFormRef.value
    .validate()
    .then(() => {
      // 将状态的中文名称转换回数字值
      const statusValue = Object.keys(statusLabels).find(
        (key) => statusLabels[key] === editForm.status
      );
      const updatedUser = {
        ...editForm,
        status: parseInt(statusValue, 10),
      };
      updateUser(updatedUser).then((res) => {
        if (res.data.code === 0) {
          message.success("更新成功");
          editModalVisible.value = false;
          getUserListByParams();
        }
      });
    })
    .catch((error) => {
      console.error("表单校验失败", error);
    });
};

// 获取用户列表
const getUserListByParams = () => {
  const params = {
    ...queryParams,
  };
  const page = {
    skip: pagination.current,
    limit: pagination.pageSize,
  };
  getUserList(params, page).then((res) => {
    if (res.data.code === 0) {
      message.success("查询成功");
      mockData.value = res.data.data.map((item, index) => ({
        ...item,
        id: (pagination.current - 1) * pagination.pageSize + index + 1,
      }));
    }
  });
  getTotalCount().then((res) => {
    if (res.data.code === 0) {
      pagination.total = res.data.data;
    } else {
      message.error("获取用户总数失败");
    }
  });
};

// 重置表单
const handleReset = () => {
  queryParams.name = "";
  queryParams.email = "";
  queryParams.phone = "";
  queryParams.status = USER_STATUS.ALL.VALUE;
  pagination.current = 1; // 重置分页到第一页
  pagination.limit = 10;
  getUserListByParams(); // 重新获取用户列表
};

// 组件挂载时获取用户列表
onMounted(() => {
  getUserListByParams();
});

// 表单引用
const editFormRef = ref(null);
const addFormRef = ref(null); // 声明 addFormRef

// 添加用户模态框显示控制
const addModalVisible = ref(false);
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
    message.error("密码和确认密码不一致");
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
const handleAdd = () => {
  // 校验表单
  addFormRef.value // 确保这里引用正确
    .validate()
    .then(() => {
      createUser({ ...addForm }).then((res) => {
        if (res.data.code === 0) {
          message.success("添加成功");
          addModalVisible.value = false;
          getUserListByParams();
        }
      });
    })
    .catch((error) => {
      console.error("表单校验失败", error);
    });
};

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  getUserListByParams();
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

.ant-row {
  width: 100%;
  margin: 0;
}

.ant-col {
  box-sizing: border-box;
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
