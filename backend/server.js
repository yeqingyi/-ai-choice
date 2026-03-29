// ============================================
// AI Choice - 后端服务
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 配置说明
// ============================================
//
// 方式1: 硅基流动 (推荐，免费模型)
// - 注册: https://cloud.siliconflow.cn
// - API Key: 个人中心 -> API密钥
// - 免费模型: Qwen2.5-7B, GLM-4, DeepSeek-V2.5
//
// 方式2: OpenAI (需要科学上网)
// - 设置 OPENAI_API_KEY
//
// 方式3: 阿里云DashScope (通义千问)
// - 注册: https://dashscope.console.aliyun.com
// - 设置 DASHSCOPE_API_KEY
// - 免费额度: 100万Tokens/月
//
// 方式4: 智谱AI
// - 注册: https://open.bigmodel.cn
// - 设置 ZHIPU_API_KEY
// - 免费额度: 100万Tokens/月
//

// 检测使用的AI服务
const USE_PROVIDER = process.env.AI_PROVIDER || 'siliconflow'; // siliconflow | openai | dashscope | zhipu

let apiKey = '';
let baseURL = 'https://api.openai.com/v1';

if (USE_PROVIDER === 'siliconflow') {
    apiKey = process.env.SILICONFLOW_API_KEY || '';
    baseURL = 'https://api.siliconflow.cn/v1';
} else if (USE_PROVIDER === 'dashscope') {
    apiKey = process.env.DASHSCOPE_API_KEY || '';
    baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
} else if (USE_PROVIDER === 'zhipu') {
    apiKey = process.env.ZHIPU_API_KEY || '';
    baseURL = 'https://open.bigmodel.cn/api/paas/v4';
} else {
    apiKey = process.env.OPENAI_API_KEY || '';
}

// 初始化 OpenAI 客户端
const configuration = new Configuration({
    apiKey: apiKey,
    basePath: baseURL
});
const openai = new OpenAIApi(configuration);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// 演示数据库
const demoData = {
    '山西旅游攻略': {
        context: '根据你的景点偏好，我来推荐最适合的路线',
        choices: [
            { icon: '🏔️', text: '山水风光', desc: '五台山、壶口瀑布等' },
            { icon: '🏛️', text: '古建筑', desc: '平遥古城、应县木塔等' },
            { icon: '🍜', text: '地道美食', desc: '刀削面、老陈醋等' },
            { icon: '🎭', text: '文化遗产', desc: '晋商文化、民俗风情' },
            { icon: '⛩️', text: '宗教圣地', desc: '五台山、悬空寺等' },
            { icon: '🎨', text: '艺术工艺', desc: '剪纸、陶瓷、漆器' }
        ]
    },
    '怎么学编程': {
        context: '根据你的学习方向和目标，我来推荐学习路线',
        choices: [
            { icon: '📱', text: '移动开发', desc: 'iOS/Android' },
            { icon: '🌐', text: '前端开发', desc: 'Web/React/Vue' },
            { icon: '⚙️', text: '后端开发', desc: 'Node/Python/Java' },
            { icon: '📊', text: '数据科学', desc: 'Python/机器学习' },
            { icon: '🎮', text: '游戏开发', desc: 'Unity/Unreal' },
            { icon: '🔐', text: '网络安全', desc: '渗透测试/安全' }
        ]
    },
    '北京周末去哪玩': {
        context: '根据你的兴趣和出行方式，我来推荐景点',
        choices: [
            { icon: '🌳', text: '户外自然', desc: '公园、山区' },
            { icon: '🏛️', text: '历史文化', desc: '故宫、长城等' },
            { icon: '🎨', text: '艺术展览', desc: '美术馆、博物馆' },
            { icon: '🍽️', text: '美食体验', desc: '特色餐厅、夜市' },
            { icon: '🛍️', text: '购物逛街', desc: '商业街、商场' },
            { icon: '👨‍👩‍👧', text: '亲子活动', desc: '动物园、游乐园' }
        ]
    }
};

// ============================================
// API: 分析问题，生成选项
// ============================================
app.post('/api/analyze', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: '请提供问题' });
        }

        // 检查演示数据
        for (const key in demoData) {
            if (question.includes(key)) {
                return res.json(demoData[key]);
            }
        }

        // 如果有真实API Key，调用AI
        if (apiKey && !apiKey.includes('placeholder')) {
            const prompt = `你是一个智能问题分析助手。用户提问后，你需要：
1. 分析问题的核心意图
2. 识别可能影响答案的关键偏好维度
3. 为每个维度生成3-5个具体的选项

用户问题：${question}

请以JSON格式返回，格式如下：
{
  "context": "简短说明为什么需要这些选择（一句话）",
  "choices": [
    {
      "icon": "emoji表情",
      "text": "选项文本",
      "desc": "选项说明（可选）"
    }
  ]
}

要求：
- icon使用直观的emoji，如🏔️🌊🏛️🎭🎨
- 选项文本简洁明了（2-6字）
- 如果问题有多个维度，可提供6-10个选项覆盖不同维度
- 选项要有区分度，避免相似选项
- 确保选项覆盖常见的偏好类型

只返回JSON，不要其他内容。`;

            // 根据provider选择模型
            let model = 'gpt-4o-mini';
            if (USE_PROVIDER === 'siliconflow') {
                model = 'Qwen/Qwen2.5-7B-Instruct';
            } else if (USE_PROVIDER === 'dashscope') {
                model = 'qwen-plus';
            } else if (USE_PROVIDER === 'zhipu') {
                model = 'glm-4-flash';
            }

            const completion = await openai.createChatCompletion({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            });

            const result = JSON.parse(completion.data.choices[0].message.content);
            return res.json(result);
        }

        // 没有API Key，返回通用演示数据
        res.json({
            context: '根据你的偏好，我来给出精准建议',
            choices: [
                { icon: '✨', text: '选项1', desc: '演示选项' },
                { icon: '🎯', text: '选项2', desc: '演示选项' },
                { icon: '💡', text: '选项3', desc: '演示选项' }
            ]
        });
        
    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({ 
            error: '分析问题失败', 
            message: error.message 
        });
    }
});

// ============================================
// API: 生成最终答案
// ============================================
app.post('/api/generate', async (req, res) => {
    try {
        const { question, analysis, selectedChoices } = req.body;
        
        if (!question || !selectedChoices) {
            return res.status(400).json({ error: '参数不完整' });
        }

        // 演示答案
        if (question.includes('山西旅游')) {
            const answers = {
                '山水风光': '**五台山**（佛教圣地+自然风光）\n- 推荐游览：菩萨顶、黛螺顶、南山寺\n- 最佳时间：6-9月\n\n**壶口瀑布**\n- 黄河上最大的瀑布\n- 建议停留：半天',
                '古建筑': '**平遥古城**（世界文化遗产）\n- 必看：日升昌票号、县衙、城墙\n- 建议停留：1天\n\n**应县木塔**\n- 世界最高木塔，千年不倒',
                '地道美食': '**太原美食**\n- 刀削面：老太原刀削面\n- 老陈醋：东湖醋园\n\n**平遥美食**\n- 平遥牛肉、碗托、栲栳栳',
                '文化遗产': '**晋商文化**\n- 乔家大院、常家庄园\n- 了解晋商辉煌历史\n\n**民俗体验**\n- 平遥古城年节活动',
                '宗教圣地': '**五台山**\n- 文殊菩萨道场\n- 建议2-3天深度游\n\n**悬空寺**\n- 恒山脚下，建在悬崖上',
                '艺术工艺': '**平遥漆器**\n- 推漆技艺，非遗传承\n\n**山西剪纸**\n- 民间艺术，适合带伴手礼'
            };
            
            let result = '## 🎯 根据你的选择，推荐以下行程\n\n';
            selectedChoices.forEach(choice => {
                if (answers[choice]) {
                    result += answers[choice] + '\n\n';
                }
            });
            return res.json({ result });
        }

        // 如果有真实API Key，调用AI
        if (apiKey && !apiKey.includes('placeholder')) {
            const prompt = `用户问题：${question}

用户选择的偏好：${selectedChoices.join('、')}

请根据用户的具体偏好，给出精准、实用的回答。

要求：
1. 回答要贴合用户选择的偏好，不要泛泛而谈
2. 内容要实用，给出具体建议或步骤
3. 使用清晰的标题和列表组织内容
4. 控制在300-500字以内，突出重点
5. 如果是旅游类，推荐具体地点；如果是学习类，推荐具体资源

用自然的语气回答，像朋友聊天一样亲切。`;

            // 根据provider选择模型
            let model = 'gpt-4o-mini';
            if (USE_PROVIDER === 'siliconflow') {
                model = 'Qwen/Qwen2.5-7B-Instruct';
            } else if (USE_PROVIDER === 'dashscope') {
                model = 'qwen-plus';
            } else if (USE_PROVIDER === 'zhipu') {
                model = 'glm-4-flash';
            }

            const completion = await openai.createChatCompletion({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            const result = completion.data.choices[0].message.content;
            return res.json({ result });
        }

        // 演示模式
        res.json({ 
            result: `## ✨ 演示答案\n\n你选择了：**${selectedChoices.join('、')}**\n\n这是一个演示模式。配置真实的API Key后，AI会根据你的选择生成精准的回答。\n\n### 📌 如何配置\n1. 获取 API Key（硅基流动/阿里云/智谱等）\n2. 在 backend/.env 文件中设置\n3. 重启服务` 
        });
        
    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({ 
            error: '生成答案失败', 
            message: error.message 
        });
    }
});

// ============================================
// 健康检查
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        provider: USE_PROVIDER,
        hasApiKey: !!apiKey && !apiKey.includes('placeholder')
    });
});

// ============================================
// 启动服务
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 AI Choice 服务已启动`);
    console.log(`   前端地址: http://localhost:${PORT}`);
    console.log(`   API地址: http://localhost:${PORT}/api`);
    console.log(`   AI提供商: ${USE_PROVIDER}\n`);
    
    if (!apiKey || apiKey.includes('placeholder')) {
        console.log('⚠️  当前使用演示模式');
        console.log('   配置API Key后可使用真实AI模型\n');
        console.log('📌 快速配置:');
        console.log('   1. 硅基流动 (推荐): https://cloud.siliconflow.cn');
        console.log('   2. 阿里云: https://dashscope.console.aliyun.com');
        console.log('   3. 智谱AI: https://open.bigmodel.cn\n');
    }
});
