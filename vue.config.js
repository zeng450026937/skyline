const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  publicPath : isDev
    ? '/'
    : '/server/client/web_app/skyline/',
  chainWebpack : (config) => {
    // hack [vue-cli-service serve] command
    if (isDev) {
      /* eslint-disable-next-line global-require */
      const path = require('path');

      // redirect to playground
      config.entry('app')
        .clear()
        .add(path.resolve('./packages/playground/main.ts'));
    }

    // support markdown file
    const mdRule = config.module.rule('md').test(/\.md$/);
    const addLoader = ({ loader, options }) => {
      mdRule.use(loader).loader(loader).options(options);
    };
    addLoader({ loader: 'vue-loader' });
    addLoader({ loader: '@skyline/markdown-loader' });
  },
};