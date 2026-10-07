// 华为云国际站公开文档，核对日期 2026-10-04。价格：USD / 百万 Token。
// 文档更新日期：2026-09-21。实际可用区域与结算价以控制台为准。
window.MAAS_DATA = {
  checkedAt: '2026-10-04',
  prices: 'https://support.huaweicloud.com/intl/en-us/price-maas/price-maas-0002.html',
  modelsSource: 'https://support.huaweicloud.com/intl/en-us/model-list-maas/model_list_0001.html',
  releases: 'https://support.huaweicloud.com/intl/en-us/wtsnew-maas/index.html',
  models: [
    { name: 'DeepSeek-V4.1-Flash', family: 'deepseek', context: '1M', description: '图片理解 · 深度思考 · 函数调用 · 前缀缓存', added: '2026-09-22', peak: ['0.3', '1.2'], offPeak: ['0.15', '0.6'], cache: ['0.03', '0.015'] },
    { name: 'GLM-5.3', family: 'glm', context: '1M', description: '深度思考 · 函数调用 · 前缀缓存', added: '2026-09-17', peak: ['1.4', '4.4'], offPeak: null, cache: ['0.26'] },
    { name: 'GLM-5.2', family: 'glm', context: '1M', description: '可配置深度思考 · 函数调用', peak: ['1.4', '4.4'], offPeak: ['0.98', '3.08'], cache: ['0.26', '0.182'] },
    { name: 'GLM-5.1', family: 'glm', context: '198K', description: '可配置深度思考 · 函数调用', peak: ['0.809', '3.235'], offPeak: ['0.566', '2.265'], cache: ['0.175', '0.123'], tier: '单次输入 < 32K', longInput: { peak: ['1.078', '3.774'], offPeak: ['0.755', '2.642'], cache: ['0.27', '0.189'] } },
    { name: 'DeepSeek-V4-Pro', family: 'deepseek', context: '1M', description: '可配置深度思考 · 函数调用', peak: ['1.617', '3.235'], offPeak: null, cache: null },
    { name: 'DeepSeek-V4-Flash', family: 'deepseek', context: '1M', description: '可配置深度思考 · 函数调用', peak: ['0.135', '0.27'], offPeak: null, cache: null }
  ]
};
