/* 树洞前端逻辑 - 所有路径已加/239210121前缀 */
let msgData = [];

// 获取DOM元素
const msgInput = document.getElementById('msgInput');
const nicknameInput = document.getElementById('nicknameInput');
const sendBtn = document.getElementById('sendBtn');
const msgList = document.getElementById('msgList');
const charCount = document.getElementById('charCount');
const errorTip = document.getElementById('errorTip');

// 提前获取CSS变量值
const rootStyle = getComputedStyle(document.documentElement);
const ERROR_COLOR = rootStyle.getPropertyValue('--error-color').trim();
const GRAY_TEXT = rootStyle.getPropertyValue('--gray-text').trim();

// 渲染留言（补全核心缺失逻辑）
function renderMessages() {
    msgList.innerHTML = '';
    // 若无留言，显示提示
    if (msgData.length === 0) {
        msgList.innerHTML = `
            <li class="message-card">
                <div class="msg-content">暂无留言，快来发布第一条树洞吧～</div>
            </li>
        `;
        return;
    }
    // 倒序渲染留言
    msgData.slice().reverse().forEach(msg => {
        const li = document.createElement('li');
        li.className = 'message-card';

        // 昵称
        const nickNameDiv = document.createElement('div');
        nickNameDiv.className = 'msg-nickname';
        nickNameDiv.textContent = msg.nickname || '匿名用户';

        // 内容
        const contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        contentDiv.textContent = msg.content;

        // 元数据（时间+点赞+删除）
        const metaDiv = document.createElement('div');
        metaDiv.className = 'msg-meta';
        metaDiv.innerHTML = `
            <span class="time">${msg.time}</span>
            <div class="like-area">
                <button class="btn-like" onclick="likeMessage(${msg.id})">
                    👍
                    <span class="like-count">${msg.likes || 0}</span>
                </button>
            </div>
            <button class="btn-delete" onclick="deleteMessage(${msg.id})">删除</button>
        `;

        // 组装节点
        li.appendChild(nickNameDiv);
        li.appendChild(contentDiv);
        li.appendChild(metaDiv);
        msgList.appendChild(li);
    });
}

// 字数统计
msgInput.addEventListener('input', function() {
    const len = this.value.length;
    charCount.textContent = `${len}/200`;
    charCount.style.color = len >= 200 ? ERROR_COLOR : GRAY_TEXT;
    errorTip.textContent = '';
});

// 输入校验
function validateInput() {
    const nickname = nicknameInput.value.trim();
    const content = msgInput.value.trim();
    
    // 内容为空
    if (!content) {
        errorTip.textContent = '💡 留言内容不能为空哦～';
        return false;
    }
    // 昵称过长
    if (nickname.length > 10) {
        errorTip.textContent = '💡 昵称不能超过10个字～';
        return false;
    }
    errorTip.textContent = '';
    return true;
}

// 删除留言
window.deleteMessage = function(id) {
    if (!confirm("确定要删除这条树洞吗？")) return;
    fetch(`/239210121/api/messages/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('删除失败');
            return res.json();
        })
        .then(() => loadMessages())
        .catch(err => {
            console.error('删除失败', err);
            alert('删除失败，请稍后重试');
        });
};

// 点赞功能
window.likeMessage = function(id) {
    fetch(`/239210121/api/messages/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (!res.ok) throw new Error('点赞失败');
        return res.json();
    })
    .then(data => {
        const targetMsg = msgData.find(msg => msg.id === id);
        if (targetMsg) {
            targetMsg.likes = data.likes;
            renderMessages();
        }
    })
    .catch(err => {
        console.error('点赞失败', err);
        alert('点赞失败，请稍后重试');
    });
};

// 加载留言
function loadMessages() {
    fetch('/239210121/api/messages')
        .then(res => {
            if (!res.ok) throw new Error('加载失败');
            return res.json();
        })
        .then(data => {
            msgData = data;
            renderMessages();
        })
        .catch(err => {
            console.error('加载留言失败', err);
            alert('加载留言失败，请刷新页面重试');
        });
}

// 发送留言
sendBtn.onclick = () => {
    if (!validateInput()) return;

    const nickname = nicknameInput.value.trim() || '匿名用户';
    const content = msgInput.value.trim();
    
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';

    fetch('/239210121/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, content })
    })
    .then(res => {
        if (!res.ok) throw new Error('发送失败');
        return res.json();
    })
    .then(() => {
        // 清空输入框
        nicknameInput.value = '';
        msgInput.value = '';
        charCount.textContent = '0/200';
        charCount.style.color = GRAY_TEXT;
        // 重新加载留言
        loadMessages();
    })
    .catch(err => {
        console.error('发送失败', err);
        alert('发送失败，请稍后重试');
    })
    .finally(() => {
        // 恢复按钮状态
        sendBtn.disabled = false;
        sendBtn.textContent = '发送留言 🚀';
    });
};

// 页面初始化
window.onload = () => {
    loadMessages();
    // 回车发送
    msgInput.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') {
            sendBtn.click();
        }
    });
};