// ============================================
// AI Choice - 后端服务
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化 OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PLACEHOLDER
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// ============================================
// API: 分析问题，生成选项
// ============================================
app.post('/api/analyze', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: '请提供问题' });
        }

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

示例：
用户问"山西旅游攻略"，应该生成关于景点类型偏好的选项（山水、古建筑、美食、文化等）
用户问"怎么学编程"，应该生成关于学习方向偏好的选项（前端、后端、移动端、数据等）

只返回JSON，不要其他内容。`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        
        res.json(result);
        
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

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        });

        const result = completion.choices[0].message.content;
        
        res.json({ result });
        
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// 启动服务
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 AI Choice 服务已启动`);
    console.log(`   前端地址: http://localhost:${PORT}`);
    console.log(`   API地址: http://localhost:${PORT}/api\n`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  警告: 未设置 OPENAI_API_KEY 环境变量');
        console.log('   请在 .env 文件中设置你的 API Key\n');
    }
});
