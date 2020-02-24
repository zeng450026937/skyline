module.exports = {

  // disable eslint-loader in production env
  lintOnSave : process.env.NODE_ENV !== 'production',

  chainWebpack : (config) => {
    // support markdown file
    const mdRule = config.module.rule('md').test(/\.md$/);
    const addLoader = ({ loader, options }) => {
      mdRule.use(loader).loader(loader).options(options);
    };
    addLoader({ loader: 'vue-loader' });
    addLoader({ loader: '@skyline/markdown-loader' });
  },
  pages : {
    index  : './packages/playground/main.ts',
    mobile : {
      entry    : './packages/playground/device/main.ts',
      template : 'public/index.html',
      title    : 'Mobile',
      filename : 'mobile.html',
    },
  },
};
