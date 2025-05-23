const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: false,
    },
    port: 3000,
  },
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].title = "vue-logistics";
      return args;
    });
  },
});
