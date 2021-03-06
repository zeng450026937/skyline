import Vue from 'vue';
import App from './App.vue';
import '@/style/skyline.bundle.scss';
import '@/style/animation.scss';
import '@/themes/skyline.globals.scss';
// import '@/themes/skyline.globals.ios.scss';
import router from '../router';
import '../style/index.scss';

Vue.config.productionTip = false;

// new Vue({
//   render : h => h(App),
// }).$mount('#app');

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
