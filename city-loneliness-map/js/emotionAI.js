import { CONFIG } from './config.js';

const demoResponses = [
  {
    type: '归属感缺失型孤独',
    analysis: '你的表达中出现「属于」「真正」等归属诉求词汇，配合空间对比（"城市很大" vs "没有一个地方"），呈现典型的「空间归属感缺失」。这种孤独不源于独处，而源于「身在人群却无所依」的落差感。',
    suggestion: '尝试将「归属感」从「空间占有」转化为「瞬间锚定」——不需要拥有整个城市，只需要建立一个只属于此刻的仪式。',
    chips: ['在固定地点拍一张天空照片', '给陌生人写一张匿名鼓励便签', '在常去的店铺记住一位店员的名字']
  },
  {
    type: '时间焦虑型孤独',
    analysis: '你的留言隐含「时间错位」叙事——在不应该孤独的时段感到孤独。这种孤独与「社会时钟」的偏离有关，你似乎在无意识中对比「他人此时应该在做什么」。',
    suggestion: '将你的「非标准时间」重新定义为「特权时间」——当别人都在标准化的轨迹上时，你拥有的是城市最安静、最真实的面貌。',
    chips: ['制作一份「深夜城市声音地图」', '给未来的自己写一封定时邮件', '寻找同样时间作息的线上社群']
  },
  {
    type: '人群中的孤独',
    analysis: '你的孤独发生在「高人群密度」场景中，这是一种「社交饱和型孤独」——不是缺少人，而是缺少「被看见」。你渴望的不是更多社交，而是更深层的连接质量。',
    suggestion: '从「被看见」转向「看见他人」——当你主动观察周围人的细节时，会创造出一种无声的连接，这种连接没有社交压力，却能缓解孤独。',
    chips: ['每天记录一个陌生人的温暖细节', '在公共场合画速写观察周围', '加入一个线下静默活动小组']
  }
];

const SYSTEM_PROMPT = `你是一个安静、克制、温暖的城市孤独情绪分析助手。
请根据用户输入的孤独瞬间，用 JSON 格式返回分析结果，不要包含任何其他文字。
JSON 字段如下：
- type: 孤独类型名称（如"归属感缺失型孤独"、"人群中的孤独"等，控制在 15 字以内）
- intensity: 用户自报情绪强度，整数 1-100
- tags: 标签数组，3-5 个与情绪相关的关键词
- analysis: 情绪解读，100-200 字，安静、克制、有洞察
- suggestion: 低压力连接建议，50-100 字
- chips: 3 条可执行的具体行动建议，每条 15 字以内

示例：
{
  "type": "归属感缺失型孤独",
  "intensity": 78,
  "tags": ["归属感缺失", "漂泊感", "城市疏离"],
  "analysis": "你的表达中出现「属于」「真正」等归属诉求词汇，呈现典型的「空间归属感缺失」。",
  "suggestion": "尝试将「归属感」从「空间占有」转化为「瞬间锚定」。",
  "chips": ["拍一张此刻的天空", "写一张匿名鼓励便签", "记住一位店员的名字"]
}`;

function parseDeepSeekReply(content) {
  try {
    // 尝试直接解析 JSON
    const parsed = JSON.parse(content);
    if (parsed.type && parsed.analysis && parsed.suggestion) {
      return {
        type: parsed.type,
        intensity: Number(parsed.intensity) || 50,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        analysis: parsed.analysis,
        suggestion: parsed.suggestion,
        chips: Array.isArray(parsed.chips) ? parsed.chips : []
      };
    }
  } catch (e) {
    // 尝试从 markdown code block 中提取 JSON
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type && parsed.analysis && parsed.suggestion) {
          return {
            type: parsed.type,
            intensity: Number(parsed.intensity) || 50,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            analysis: parsed.analysis,
            suggestion: parsed.suggestion,
            chips: Array.isArray(parsed.chips) ? parsed.chips : []
          };
        }
      } catch (e2) {
        console.warn('解析 DeepSeek JSON block 失败', e2);
      }
    }
    console.warn('解析 DeepSeek 响应失败', e);
  }
  return null;
}

export async function analyzeEmotion(input) {
  if (CONFIG.DEEPSEEK_API_KEY) {
    try {
      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: input }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        console.warn('DeepSeek API 响应异常', response.status, await response.text());
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = parseDeepSeekReply(content);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('DeepSeek API 调用失败，使用本地演示响应', e);
    }
  }
  return demoResponses[input.length % demoResponses.length];
}
