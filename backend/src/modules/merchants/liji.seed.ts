import type { MerchantConfig } from "./merchant.types.ts";

export const lijiMerchantSeed: MerchantConfig = {
  id: "liji",
  name: "李记好味道",
  storageKey: "ai-restaurant-review:liji",
  store: {
    id: "liji-main",
    name: "李记好味道",
  },
  theme: {
    primary: "#A10C05",
    primaryLight: "#FBDCCE",
    surface: "#FBF9F5",
    surfaceStrong: "#F5E6D3",
    text: "#3C2A21",
    muted: "#705A4F",
    border: "#E4BEB8",
  },
  ai: {
    provider: "deepseek",
    endpoint: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    fallbackToLocal: true,
  },
  copy: {
    common: {
      brandKicker: "真实体验",
      homeEyebrow: "用心吃饭 · 自然表达",
      homeNote: "不必刻意夸赞，AI 只帮你把真实感受说得更清楚。",
      selected: "已选",
      select: "选择",
      selectedReview: "你选择的评价",
      emptyMessageTip: "真实的一句话就够了，留空也能继续。",
    },
    steps: {
      dishes: "第一步",
      tags: "第二步",
      message: "第三步",
      generated: "已生成",
      platform: "最后一步",
      complete: "已完成",
    },
    actions: {
      continue: "继续",
      back: "上一步",
      skip: "暂不补充",
      generate: "生成 3 条评价",
      useReview: "使用这条评价",
      regenerate: "重新生成",
      startOver: "重新开始",
    },
    home: {
      title: "这顿饭，哪一口让你记住了？",
      description: "分享您的真实用餐瞬间，\nAI 为您整理成一句好表达。",
      action: "开始记录美味",
    },
    dishes: {
      title: "今天品尝了哪些美味？",
      description: "最多选择 6 道，方便为您定制心里的真实评价。",
    },
    tags: {
      title: "哪些地方让你印象深刻？",
      description: "请选择真实感受，可多选。",
    },
    message: {
      title: "还有什么想告诉大家？",
      description: "补充一句话，会更像你的真实表达。",
      placeholder: "例如：朋友推荐来的，酸菜蹄膀真的很香",
    },
    generating: {
      title: "正在整理你的用餐体验...",
      description: "马上生成 3 种表达方式",
    },
    reviews: {
      title: "选择最像你说话方式的一条",
      description: "你可以返回修改菜品或感受，再重新生成。",
    },
    platform: {
      title: "发布到哪里？",
      description: "我们会先复制评价，方便你直接粘贴发布。",
    },
    complete: {
      title: "感谢你的真实反馈！",
      description: "你的体验会帮助更多朋友找到这家店。",
      action: "再记录一次",
    },
    selection: {
      dishSummary: "已选择 {count} / {limit} 道菜",
    },
  },
  rules: {
    maxDishSelection: 6,
    maxMessageLength: 120,
    generationDelayMs: 1600,
  },
  dishes: [
    { id: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" },
    { id: "pickled-pork", name: "酸菜蹄膀", description: "软糯开胃" },
    { id: "spicy-chicken-hotpot", name: "辣子鸡火锅", description: "香辣过瘾" },
    { id: "bean-hotpot", name: "豆米火锅", description: "浓郁绵密" },
    { id: "mala-tang", name: "麻辣烫", description: "贵阳风味" },
    { id: "intestine-chicken-hotpot", name: "肥肠鸡火锅", description: "软糯鲜香" },
  ],
  tagGroups: [
    {
      id: "taste",
      name: "味道",
      tags: [
        { id: "tasty", name: "味道不错" },
        { id: "broth", name: "汤底鲜香" },
        { id: "rice-friendly", name: "很下饭" },
      ],
    },
    {
      id: "service",
      name: "服务",
      tags: [
        { id: "warm-service", name: "服务热情" },
        { id: "fast-service", name: "上菜快" },
      ],
    },
    {
      id: "experience",
      name: "体验",
      tags: [
        { id: "comfortable", name: "环境舒服" },
        { id: "generous", name: "分量足" },
        { id: "value", name: "性价比高" },
      ],
    },
  ],
  reviewStyles: [
    {
      id: "daily",
      name: "日常分享型",
      label: "生动接地气",
      template: "今天来{merchantName}吃饭，点了{dishText}。{tagSentence}{messageSentence}整体吃得很舒服，愿意下次再来。",
    },
    {
      id: "friend",
      name: "朋友推荐型",
      label: "自然推荐",
      template: "和朋友一起来{merchantName}，这次尝了{dishText}。{tagSentence}{messageSentence}想把这家店推荐给同样喜欢认真吃饭的朋友。",
    },
    {
      id: "local",
      name: "本地体验型",
      label: "简洁真实",
      template: "路过{merchantName}试了一次，{dishText}给我留下了印象。{tagSentence}{messageSentence}是会想再来的一顿家常好味道。",
    },
  ],
  platforms: [
    {
      id: "dianping",
      name: "大众点评",
      url: "https://www.dianping.com/",
      actionHint: "评价已复制，请打开大众点评粘贴发布。",
      miniProgram: { appId: "", path: "" },
    },
    {
      id: "meituan",
      name: "美团",
      url: "https://dpurl.cn/swRRFoqz",
      actionHint: "评价已复制，请打开美团粘贴发布。",
      miniProgram: { appId: "", path: "" },
    },
  ],
};
