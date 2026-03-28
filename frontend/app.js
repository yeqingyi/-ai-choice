// ============================================
// AI Choice - 前端交互逻辑
// ============================================

// 状态管理
const state = {
    question: '',
    analysis: null,
    selectedChoices: [],
    result: '',
    history: []
};

// DOM 元素
const elements = {
    // Steps
    stepQuestion: document.getElementById('step-question'),
    stepChoice: document.getElementById('step-choice'),
    stepResult: document.getElementById('step-result'),
    
    // Question
    questionInput: document.getElementById('question-input'),
    submitQuestion: document.getElementById('submit-question'),
    
    // Choice
    choiceContext: document.getElementById('choice-context'),
    choicesContainer: document.getElementById('choices-container'),
    submitChoice: document.getElementById('submit-choice'),
    
    // Result
    resultContent: document.getElementById('result-content'),
    metaInfo: document.getElementById('meta-info'),
    restart: document.getElementById('restart'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text')
};

// API 配置
const API_BASE = 'http://localhost:3000/api';

// ============================================
// 页面初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadHistory();
});

// ============================================
// 事件监听
// ============================================
function initEventListeners() {
    // 提交问题
    elements.submitQuestion.addEventListener('click', handleSubmitQuestion);
    elements.questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmitQuestion();
        }
    });
    
    // 提交选择
    elements.submitChoice.addEventListener('click', handleSubmitChoice);
    
    // 重新开始
    elements.restart.addEventListener('click', handleRestart);
}

// ============================================
// 阶段1: 提交问题
// ============================================
async function handleSubmitQuestion() {
    const question = elements.questionInput.value.trim();
    
    if (!question) {
        shakeElement(elements.questionInput);
        return;
    }
    
    state.question = question;
    showLoading('🤔 AI正在分析你的问题...');
    
    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        if (!response.ok) {
            throw new Error('请求失败');
        }
        
        const data = await response.json();
        state.analysis = data;
        
        hideLoading();
        showChoices();
        
    } catch (error) {
        hideLoading();
        showError('分析问题失败，请检查后端服务是否启动');
        console.error('Error:', error);
    }
}

// ============================================
// 阶段2: 显示选项
// ============================================
function showChoices() {
    const { choices, context } = state.analysis;
    
    elements.choiceContext.textContent = context;
    elements.choicesContainer.innerHTML = '';
    
    choices.forEach((choice, index) => {
        const choiceEl = document.createElement('div');
        choiceEl.className = 'choice-item';
        choiceEl.innerHTML = `
            <span class="choice-icon">${choice.icon}</span>
            <div class="choice-content">
                <div class="choice-text">${choice.text}</div>
                ${choice.desc ? `<div class="choice-desc">${choice.desc}</div>` : ''}
            </div>
            <div class="choice-check">✓</div>
        `;
        
        choiceEl.addEventListener('click', () => toggleChoice(choiceEl, index));
        elements.choicesContainer.appendChild(choiceEl);
    });
    
    elements.submitChoice.disabled = true;
    state.selectedChoices = [];
    
    switchStep('choice');
}

function toggleChoice(element, index) {
    const isSelected = element.classList.contains('selected');
    
    if (isSelected) {
        element.classList.remove('selected');
        state.selectedChoices = state.selectedChoices.filter(i => i !== index);
    } else {
        element.classList.add('selected');
        state.selectedChoices.push(index);
    }
    
    elements.submitChoice.disabled = state.selectedChoices.length === 0;
}

// ============================================
// 阶段3: 提交选择，生成结果
// ============================================
async function handleSubmitChoice() {
    if (state.selectedChoices.length === 0) return;
    
    const selectedTexts = state.selectedChoices.map(i => state.analysis.choices[i].text);
    
    showLoading('✨ AI正在生成答案...');
    
    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: state.question,
                analysis: state.analysis,
                selectedChoices: selectedTexts
            })
        });
        
        if (!response.ok) {
            throw new Error('请求失败');
        }
        
        const data = await response.json();
        state.result = data.result;
        
        hideLoading();
        showResult();
        
        // 保存历史
        saveToHistory({
            question: state.question,
            choices: selectedTexts,
            result: state.result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        hideLoading();
        showError('生成答案失败，请检查后端服务是否启动');
        console.error('Error:', error);
    }
}

// ============================================
// 阶段4: 显示结果
// ============================================
function showResult() {
    elements.resultContent.innerHTML = markedText(state.result);
    
    const selectedTexts = state.selectedChoices.map(i => state.analysis.choices[i].text);
    elements.metaInfo.textContent = `选择: ${selectedTexts.join(' + ')}`;
    
    switchStep('result');
}

// ============================================
// 重新开始
// ============================================
function handleRestart() {
    state.question = '';
    state.analysis = null;
    state.selectedChoices = [];
    state.result = '';
    
    elements.questionInput.value = '';
    elements.resultContent.innerHTML = '';
    elements.metaInfo.textContent = '';
    
    switchStep('question');
}

// ============================================
// UI 辅助函数
// ============================================
function switchStep(stepName) {
    elements.stepQuestion.classList.remove('active');
    elements.stepChoice.classList.remove('active');
    elements.stepResult.classList.remove('active');
    
    switch (stepName) {
        case 'question':
            elements.stepQuestion.classList.add('active');
            elements.questionInput.focus();
            break;
        case 'choice':
            elements.stepChoice.classList.add('active');
            break;
        case 'result':
            elements.stepResult.classList.add('active');
            break;
    }
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
    elements.submitQuestion.disabled = true;
    elements.submitChoice.disabled = true;
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
    elements.submitQuestion.disabled = false;
}

function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'shake 0.5s ease';
}

function showError(message) {
    alert(message);
}

// ============================================
// 文本格式化
// ============================================
function markedText(text) {
    // 简单的Markdown处理
    let html = text
        // 标题
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h3>$1</h3>')
        // 粗体
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // 列表
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        // 换行
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // 包裹段落
    html = '<p>' + html + '</p>';
    
    // 修复列表
    html = html.replace(/<\/p><li>/g, '</p><ul><li>');
    html = html.replace(/<\/li><p>/g, '</li></ul><p>');
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
}

// ============================================
// 历史记录
// ============================================
function loadHistory() {
    try {
        const history = localStorage.getItem('ai-choice-history');
        state.history = history ? JSON.parse(history) : [];
    } catch (e) {
        state.history = [];
    }
}

function saveToHistory(item) {
    state.history.unshift(item);
    if (state.history.length > 20) {
        state.history.pop();
    }
    localStorage.setItem('ai-choice-history', JSON.stringify(state.history));
}

// 添加shake动画
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
