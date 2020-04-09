module.exports = (api, options) => {
  api.chainWebpack((config) => {
    const {
      autoimport = true,
      svgsprite = true,
      svgcomponent = false,
      i18n = true,
    } = options['line-ui'] || {};

    if (autoimport) {
      config.module
        .rule('vue')
        .use('line-auto-import')
        .loader(require.resolve('@line-ui/webpack-loader-auto-import'))
        .options(require('@line-ui/line/import.config'))
        .after('vue-loader');
    }

    if (svgsprite) {
      config.module.rules.delete('svg');

      config.module
        .rule('svg')
        .test(/\.(svg)(\?.*)?$/)
        .use('svg-sprite')
        .loader(
          require.resolve('@line-ui/webpack-plugin-svg-sprite/lib/loader')
        );

      config
        .plugin('svg-sprite')
        .use(require('@line-ui/webpack-plugin-svg-sprite'));
    } else if (svgcomponent) {
      if (api.hasPlugin('babel')) {
        config.module.rules.delete('svg');

        config.module
          .rule('svg')
          .test(/\.(svg)(\?.*)?$/)
          // .use('babel-loader')
          // .loader(require.resolve('babel-loader'))
          // .end()
          .use('svg-component')
          .loader(require.resolve('@line-ui/webpack-loader-svg-component'));
      } else {
        console.log('svg-component require babel-loader with jsx support.');
      }
    }

    if (i18n) {
      config.plugin('i18n').use(require('@line-ui/webpack-plugin-i18n'));
    }
  });
};
