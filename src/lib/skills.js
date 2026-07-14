export const BUILTIN_SKILLS = [
  {
    id: 'guochao-comic', name: '国潮漫画', category: '漫画',
    description: '硬朗墨线、东方配色与戏剧化分镜，适合角色海报和故事场景。',
    tags: ['粗线稿', '高对比', '东方叙事'], accent: '#e44b32', tone: '#f7d8bd', cover: '/skills/guochao-comic.svg',
    bestFor: '角色海报、武侠场景、漫画分镜',
    avoid: '廉价古风素材拼贴、过度金色、现代英文排版、五官崩坏',
    preview: '侠客立于城楼，风吹披风',
    promptPrefix: '创作一幅高完成度的中国国潮漫画作品。',
    promptSuffix: '使用有力量的手绘墨线、清晰的黑白块面、朱红与靛青为主的东方配色，强调戏剧化透视和分镜感，人物造型利落，背景融入传统纹样但不过度堆砌，画面精致，无水印，无多余文字。'
  },
  {
    id: 'ink-breath', name: '水墨留白', category: '东方',
    description: '用水墨浓淡与大面积留白组织意境，适合山水、人物和诗意场景。',
    tags: ['宣纸肌理', '留白', '淡彩'], accent: '#3f4a46', tone: '#d9ddd4', cover: '/skills/ink-breath.svg',
    bestFor: '山水意境、古风人物、诗词配图',
    avoid: '满幅填充、重度油画笔触、艳丽霓虹色、伪书法文字',
    preview: '薄雾远山与一叶孤舟',
    promptPrefix: '以当代东方水墨画的方式表现以下主题。',
    promptSuffix: '宣纸纹理自然可见，墨色有干湿浓淡和飞白变化，以大面积留白营造呼吸感，只点缀少量矿物淡彩，构图克制、诗意、层次清晰，无现代文字，无印章水印。'
  },
  {
    id: 'storybook-gouache', name: '暖光绘本', category: '插画',
    description: '柔软笔触和温暖叙事感，让日常场景像一本可以翻阅的故事书。',
    tags: ['水粉', '颗粒感', '治愈'], accent: '#e68b55', tone: '#f7df9c', cover: '/skills/storybook-gouache.svg',
    bestFor: '亲子故事、治愈日常、动物角色',
    avoid: '塑料 3D 质感、过度锐化、僵硬表情、复杂文字',
    preview: '小狐狸在灯下读一封信',
    promptPrefix: '绘制一幅温暖、富有叙事性的儿童绘本插画。',
    promptSuffix: '采用手绘水粉与彩铅混合质感，边缘柔和，保留细腻纸张颗粒，暖色环境光，角色表情自然可爱但不过分幼稚，构图像绘本跨页，细节丰富，无文字，无水印。'
  },
  {
    id: 'clay-studio', name: '黏土小剧场', category: '3D',
    description: '手作黏土角色与微缩布景，呈现柔软、可触摸的定格动画质感。',
    tags: ['黏土材质', '微缩景观', '柔光'], accent: '#7b63d2', tone: '#d9cef8', cover: '/skills/clay-studio.svg',
    bestFor: '萌系角色、产品拟人、微缩场景',
    avoid: '光滑塑料、真人皮肤、比例混乱、过强镜面反射',
    preview: '迷你面包店准备开门',
    promptPrefix: '将主题制作成精致的手工黏土定格动画场景。',
    promptSuffix: '角色和物件具有可见的手捏痕迹与哑光软陶质感，微缩布景比例统一，使用摄影棚柔光和浅景深，色彩明快但协调，真实微距摄影效果，细节可爱，无文字，无水印。'
  },
  {
    id: 'pixel-arcade', name: '像素街机', category: '像素',
    description: '16-bit 游戏画面语言，适合横版场景、角色立绘和复古界面氛围。',
    tags: ['16-bit', '有限色板', '像素光影'], accent: '#3d74e7', tone: '#b9d7ff', cover: '/skills/pixel-arcade.svg',
    bestFor: '游戏场景、像素头像、复古叙事',
    avoid: '抗锯齿模糊、矢量平滑边缘、无限渐变、现代 UI 字样',
    preview: '雨夜车站等待末班列车',
    promptPrefix: '把主题设计成精美的 16-bit 复古像素游戏画面。',
    promptSuffix: '使用清晰可辨的像素块、有限但有层次的色板、像素级光影和轮廓高光，构图具备横版游戏场景感，避免模糊插值与写实平滑边缘，无 UI 文字，无水印。'
  },
  {
    id: 'cinematic-concept', name: '电影概念图', category: '概念',
    description: '宽银幕构图与可信光影，快速得到具有制作提案感的视觉概念图。',
    tags: ['宽银幕', '体积光', '叙事镜头'], accent: '#cb8c2f', tone: '#ead1a4', cover: '/skills/cinematic-concept.svg',
    bestFor: '世界观设定、影视场景、宏大建筑',
    avoid: '无焦点的细节堆砌、游戏 UI、过度 HDR、比例失真',
    preview: '沙海中的巨型移动城市',
    promptPrefix: '创作一张专业影视项目使用的电影概念设计图。',
    promptSuffix: '宽银幕叙事构图，明确前中后景，真实材质与尺度关系，电影级体积光和空气透视，色彩分级克制，视觉焦点清晰，兼具宏大感与可信细节，无字幕，无水印。'
  },
  {
    id: 'neon-noir', name: '霓虹黑色电影', category: '科幻',
    description: '湿润夜色、彩色霓虹与悬疑氛围，适合未来城市和人物故事。',
    tags: ['霓虹反射', '雨夜', '低调光'], accent: '#d64fd8', tone: '#99b7ff', cover: '/skills/neon-noir.svg',
    bestFor: '未来都市、悬疑人物、夜景故事',
    avoid: '全画面霓虹堆叠、曝光溢出、廉价赛博符号、乱码招牌',
    preview: '侦探穿过凌晨的机械市场',
    promptPrefix: '以未来主义霓虹黑色电影风格呈现以下场景。',
    promptSuffix: '夜景低调光，青蓝与洋红霓虹在湿润地面形成反射，局部烟雾和轮廓光塑造空间，镜头具有悬疑叙事感，人物与环境细节真实，避免廉价灯光堆叠，无文字，无水印。'
  },
  {
    id: 'editorial-paper', name: '纸艺海报', category: '设计',
    description: '剪纸层叠与编辑设计构图，适合节日主视觉、封面和抽象主题。',
    tags: ['剪纸', '层叠阴影', '编辑构图'], accent: '#0b9b88', tone: '#bce8dd', cover: '/skills/editorial-paper.svg',
    bestFor: '节日主视觉、活动封面、抽象概念',
    avoid: '真实照片质感、杂乱配色、品牌 Logo、不可读装饰文字',
    preview: '春天从城市屋顶生长出来',
    promptPrefix: '设计一幅具有收藏感的立体纸艺编辑海报。',
    promptSuffix: '使用多层彩色纸张切割与折叠形成主体，边缘干净，层叠阴影真实，构图大胆且留有呼吸空间，颜色控制在协调的四到六色，具备高级平面设计感，不出现文字和品牌标识，无水印。'
  }
]

export function getSkill(skillId) {
  return BUILTIN_SKILLS.find((skill) => skill.id === skillId) || null
}

export function applySkill(prompt, skill) {
  const text = String(prompt || '').trim()
  if (!text || !skill) return text
  return [
    `[绘图 Skill：${skill.name}]`,
    `创作任务：${text}`,
    `视觉方向：${skill.promptPrefix}`,
    `执行配方：${skill.promptSuffix}`,
    `画面要求：主体识别清楚，构图完整，视觉层级明确，细节服务主题，输出高完成度单幅作品。`,
    `避免出现：${skill.avoid}`
  ].join('\n')
}
