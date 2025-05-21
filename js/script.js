document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = checkLogin();
    if (!loggedInUser) return;

    const buddiesMenu = document.getElementById('buddiesMenu');
    const messagesMenu = document.getElementById('messagesMenu');
    const logoutMenu = document.getElementById('logoutMenu');
    const listArea = document.getElementById('listArea');
    const contentArea = document.getElementById('contentArea');
    const menuItems = document.querySelectorAll('.menu ul li');
    const searchButton = document.getElementById('searchButton');
    const userAvatar = document.getElementById('userAvatar');
    const userNameDisplay = document.getElementById('userName');

    let currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    let allUsersData = JSON.parse(localStorage.getItem('users')) || []; 
    
    const latestUserData = allUsersData.find(u => u.email === currentUser.email);
    if (latestUserData) {
        currentUser = latestUserData; 
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser)); 
    } else if (!currentUser.profile) { 
        currentUser.profile = { name: currentUser.username, avatar: 'images/default_avatar.png', aboutMe: '', major: 'Other', expert: [], needsTutor: [] };
        if (!allUsersData.find(u => u.email === currentUser.email)) {
            allUsersData.push(currentUser);
            localStorage.setItem('users', JSON.stringify(allUsersData));
        }
    }

    let buddies = [];
    let messages = [];
    let activeChatBuddyEmail = null; 

    function formatLastSeen(timestamp, isOnlineFlag = false) {
        if (isOnlineFlag) return 'Online'; // Prioritize isOnline flag
        if (!timestamp) return 'Offline';
        
        const now = new Date();
        const lastSeenDate = new Date(timestamp);
        const diffMs = now - lastSeenDate;
        const diffSecs = Math.round(diffMs / 1000);
        const diffMins = Math.round(diffSecs / 60);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffSecs < 60) return `Active ${diffSecs}s ago`; // More specific for very recent activity
        if (diffMins < 60) return `Active ${diffMins}m ago`;
        if (diffHours < 24) return `Active ${diffHours}h ago`;
        if (diffDays === 1) return 'Last seen yesterday';
        if (diffDays < 7) return `Last seen ${diffDays}d ago`;
        return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
    }

    function loadAppInitialData() {
        allUsersData = JSON.parse(localStorage.getItem('users')) || []; 
        const buddiesDataStorage = JSON.parse(localStorage.getItem('buddiesData')) || {};
        buddies = buddiesDataStorage[currentUser.email] || [];

        const messagesDataStorage = JSON.parse(localStorage.getItem('messagesData')) || {};
        messages = messagesDataStorage[currentUser.email] || [];
        
        if (userAvatar) userAvatar.src = currentUser.profile.avatar || 'images/default_avatar.png';
        if (userNameDisplay) userNameDisplay.textContent = currentUser.profile.name || currentUser.username;
        
        handleInitialView();
    }
        
    loadAppInitialData();

    buddiesMenu.addEventListener('click', (e) => { 
        e.preventDefault(); setActiveMenu('buddiesMenu'); renderBuddies(); clearContentAreaToWelcome(); activeChatBuddyEmail = null;
    });
    messagesMenu.addEventListener('click', (e) => { 
        e.preventDefault(); setActiveMenu('messagesMenu'); renderMessages(); clearContentAreaToWelcome(); activeChatBuddyEmail = null;
    });
    if (logoutMenu) logoutMenu.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
    if (searchButton) searchButton.addEventListener('click', () => { window.location.href = 'swiper.html'; });

    function setActiveMenu(activeId) {
        menuItems.forEach(item => item.classList.remove('active'));
        const activeElement = document.getElementById(activeId);
        if (activeElement) {
            activeElement.classList.add('active');
            history.replaceState(null, null, '#' + activeId.replace('Menu','')); 
        }
    }

    function renderBuddies() {
        listArea.innerHTML = '';
        if (buddies.length === 0) {
            listArea.innerHTML = '<p class="empty-list-placeholder">No buddies yet. <br>Try "Search New Buddies"!</p>';
            return;
        }
        buddies.forEach((buddy) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const buddyPhoto = buddy.photo || 'images/default_avatar.png';
            const buddyFullData = allUsersData.find(u => u.email === buddy.email);
            const statusText = formatLastSeen(buddyFullData?.lastSeen, buddyFullData?.isOnline);
            const statusClass = buddyFullData?.isOnline ? 'online' : 'offline';

            const itemContent = document.createElement('div');

            itemContent.className = 'list-item-main-content';
            itemContent.innerHTML = `
            <div class="avatar-container-list">
                    <img src="${buddyPhoto}" alt="${buddy.name}" class="avatar-small">
                    <span class="status-indicator-list ${statusClass}"></span>
                </div>
                <div class="list-item-content">
                    <strong>${buddy.name}</strong>
                    <small class="buddy-status-list ${statusClass}">${statusText}</small> 
                </div>
            `;
            itemContent.addEventListener('click', () => {
                showBuddyProfile(buddy.email);
                if (window.innerWidth <= 768) { 
                    listArea.style.display = 'none';
                    searchButton.style.display = 'none';
                }
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Remove Buddy';
            deleteBtn.className = 'delete-btn-list';
            deleteBtn.addEventListener('click', (event) => { event.stopPropagation(); removeBuddy(buddy.email); });

            div.appendChild(itemContent);
            div.appendChild(deleteBtn);
            listArea.appendChild(div);
        });
    }

    function renderMessages() {
        listArea.innerHTML = '';
         if (messages.length === 0) {
            listArea.innerHTML = '<p class="empty-list-placeholder">No messages yet. <br>Start a conversation!</p>';
            return;
        }
        messages.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0) || (a.name || '').localeCompare(b.name || ''));

        messages.forEach((messageThread) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            
            // Data buddy dari list buddies pengguna saat ini (untuk foto, nama dasar)
            const buddyInfoFromList = buddies.find(b => b.email === messageThread.buddyEmail); 
            // Data buddy lengkap dari allUsersData (untuk status isOnline, lastSeen)
            const buddyFullData = allUsersData.find(u => u.email === messageThread.buddyEmail);

            const buddyPhoto = buddyInfoFromList ? (buddyInfoFromList.photo || 'images/default_avatar.png') : 'images/default_avatar.png';
            const buddyName = buddyInfoFromList ? buddyInfoFromList.name : (messageThread.name || 'Unknown Buddy');
            
            // Tentukan teks dan kelas status
            const statusText = formatLastSeen(buddyFullData?.lastSeen, buddyFullData?.isOnline);
            const statusClass = buddyFullData?.isOnline ? 'online' : 'offline';

            const itemContent = document.createElement('div');
            itemContent.className = 'list-item-main-content'; 
            itemContent.innerHTML = `
                <div class="avatar-container-list">
                    <img src="${buddyPhoto}" alt="${buddyName}" class="avatar-small">
                    <span class="status-indicator-list ${statusClass}"></span>
                </div>
                <div class="list-item-content">
                    <strong>${buddyName}</strong>
                    <small class="message-preview">${messageThread.lastMessage ? (messageThread.lastMessage.length > 20 ? messageThread.lastMessage.substring(0,17) + "..." : messageThread.lastMessage) : 'No messages'}</small>
                    <small class="buddy-status-list ${statusClass}">${statusText}</small> 
                </div>
            `;
            itemContent.addEventListener('click', () => showChat(messageThread.buddyEmail));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Chat History';
            deleteBtn.className = 'delete-btn-list';
            deleteBtn.addEventListener('click', (event) => { event.stopPropagation(); removeMessageThread(messageThread.buddyEmail); });
            
            div.appendChild(itemContent);
            div.appendChild(deleteBtn);
            listArea.appendChild(div);
        });
    }

    function showBuddyProfile(buddyEmail) {
        const buddy = buddies.find(b => b.email === buddyEmail); 
        if (!buddy) {
            clearContentAreaToWelcome('<p class="empty-list-placeholder">Buddy not found.</p>');
            return;
        }
        contentArea.innerHTML = `
        ${window.innerWidth <= 768 ? '<button id="backToListBtn" class="back-btn">🔙 Back</button>' : ''}
          <div class="profile-full">
            <div class="profile-header">
              <img src="${buddy.photo || 'images/default_avatar.png'}" alt="${buddy.name}" class="profile-photo-large">
              <h2>${buddy.name || 'N/A'}</h2>
              <p>${buddy.email || ''}</p>
            </div>
            ${buddy.aboutMe ? `<div class="profile-section"><h3>About ${buddy.name.split(' ')[0]}</h3><p>${buddy.aboutMe.replace(/\n/g, '<br>')}</p></div>` : ''}
            <div class="profile-info profile-section">
              <h3>Academic Info</h3>
              <p><strong>Level:</strong> ${buddy.level || 'N/A'}</p>
              <p><strong>Major:</strong> ${buddy.major || 'N/A'}</p>
              <p><strong>Expert in:</strong> ${buddy.expert && buddy.expert.length > 0 ? buddy.expert.join(', ') : 'N/A'}</p>
              <p><strong>Needs help with:</strong> ${buddy.needsTutor && buddy.needsTutor.length > 0 ? buddy.needsTutor.join(', ') : 'N/A'}</p>
            </div>
            <div class="profile-actions">
                <button id="startChatWithBuddyBtn" class="search-btn">Start Chat</button>
                <button id="removeBuddyFromProfileBtn" class="delete-btn-action">Remove Buddy</button>
            </div>
          </div>
        `;
        document.getElementById('startChatWithBuddyBtn').addEventListener('click', () => {
            
            let chatIndex = messages.findIndex(m => m.buddyEmail === buddy.email);
            if (chatIndex === -1) {
                messages.push({ name: buddy.name, buddyEmail: buddy.email, lastMessage: 'Chat started!', chat: [], lastMessageTimestamp: Date.now() });
                saveMessages();
            }
            setActiveMenu('messagesMenu'); renderMessages(); showChat(buddy.email);
        });
        document.getElementById('removeBuddyFromProfileBtn').addEventListener('click', () => removeBuddy(buddy.email) );

            const backButton = document.getElementById('backToListBtn');

        if (backButton) {
            backButton.addEventListener('click', () => {
                // Menghapus konten chat
                contentArea.innerHTML = '';
                // Menampilkan kembali list area dan tombol pencarian
                listArea.style.display = 'block';
                searchButton.style.display = 'block';
            });
        }
    }
    
function showChat(buddyEmail) {
    allUsersData = JSON.parse(localStorage.getItem('users')) || []; 
    activeChatBuddyEmail = buddyEmail;
    const messageThread = messages.find(m => m.buddyEmail === activeChatBuddyEmail);
    const buddyInfoFromList = buddies.find(b => b.email === activeChatBuddyEmail); 
    const buddyFullData = allUsersData.find(u => u.email === activeChatBuddyEmail); 

    if (!messageThread || !buddyInfoFromList) {
        clearContentAreaToWelcome('<p class="empty-list-placeholder">Chat or buddy details not found.</p>');
        activeChatBuddyEmail = null; renderMessages(); return;
    }

    // aku modifikasi di sini
    if (window.innerWidth <= 768) {
        
        listArea.style.display = 'none';
        searchButton.style.display = 'none';
        buddiesMenu.style.display = 'none';
        messagesMenu.style.display = 'none';
        profileMenu.style.display = 'none';
        logoutMenu.style.display = 'none';
    }

    contentArea.innerHTML = `
        ${window.innerWidth <= 768 ? '<button id="backToListBtn" class="back-btn">🔙 Back</button>' : ''}
        <div class="chat-container-dynamic">
            <div class="chat-header">
                <div class="chat-header-avatar-status">
                    <img src="${buddyInfoFromList.photo || 'images/default_avatar.png'}" alt="${buddyInfoFromList.name}" class="avatar-small">
                </div>
                <div class="chat-header-info">
                    <h2>${buddyInfoFromList.name}</h2>
                </div>
                <button id="deleteChatFromHeaderBtn" class="delete-btn-header" title="Delete Chat History">🗑️ Delete Chat</button>
            </div>
            <div class="chat-messages-dynamic">
                ${messageThread.chat.map(msg => `
                    <div class="chat-message ${msg.sender === 'self' ? 'self' : 'friend'}">
                        ${msg.text}
                        <span class="chat-timestamp">${new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-container-dynamic">
                <input type="text" id="chatInput" class="chat-input" placeholder="Type a message...">
                <button id="sendMessageBtn" class="send-btn">Send</button>
            </div>
        </div>
    `;
    const chatMessagesArea = contentArea.querySelector('.chat-messages-dynamic');
    if(chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    document.getElementById('deleteChatFromHeaderBtn').addEventListener('click', () => removeMessageThread(buddyFullData.email));
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    const chatInputEl = document.getElementById('chatInput');
    if (chatInputEl) chatInputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // Menambahkan event listener untuk tombol "Back"
    const backButton = document.getElementById('backToListBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            // Menghapus konten chat
            contentArea.innerHTML = '';
            // Menampilkan kembali list area dan tombol pencarian
            listArea.style.display = 'block';
            searchButton.style.display = 'block';
            buddiesMenu.style.display = 'block';
            messagesMenu.style.display = 'block';
            profileMenu.style.display = 'block';
            logoutMenu.style.display = 'block';
            // Kembali ke tampilan daftar pesan
            renderMessages();
        });
    }
}


    function sendMessage() { 
        const messageInput = document.getElementById('chatInput');
        if (!messageInput) return; 
        const messageText = messageInput.value.trim();

        if (messageText !== '' && activeChatBuddyEmail !== null) {
            const threadIndex = messages.findIndex(m => m.buddyEmail === activeChatBuddyEmail);
            if (threadIndex === -1) { return; }
            const currentTimestamp = Date.now();
            const newMessage = { sender: 'self', text: messageText, timestamp: currentTimestamp };

            messages[threadIndex].chat.push(newMessage);
            messages[threadIndex].lastMessage = messageText;
            messages[threadIndex].lastMessageTimestamp = currentTimestamp;
            saveMessages();
            
            const chatMessagesContainer = contentArea.querySelector('.chat-messages-dynamic');
            if (chatMessagesContainer) {
                const msgEl = document.createElement('div');
                msgEl.className = 'chat-message self';
                msgEl.innerHTML = `${newMessage.text}<span class="chat-timestamp">${new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
                chatMessagesContainer.appendChild(msgEl);
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            }
            if (document.querySelector('.menu ul li.active')?.id === 'messagesMenu') renderMessages();
            messageInput.value = ''; messageInput.focus();
        }
    }
    function removeBuddy(buddyEmail) { 
        if (!confirm('Remove this buddy and delete chat history?')) return;
        const buddyName = (buddies.find(b => b.email === buddyEmail) || {}).name;
        buddies = buddies.filter(b => b.email !== buddyEmail);
        messages = messages.filter(m => m.buddyEmail !== buddyEmail);
        saveBuddies(); saveMessages();

        if ((contentArea.querySelector('.profile-full h2')?.textContent === buddyName) || (activeChatBuddyEmail === buddyEmail)) {
            clearContentAreaToWelcome(); activeChatBuddyEmail = null;
        }
        const currentActiveMenuId = document.querySelector('.menu ul li.active')?.id;
        if (currentActiveMenuId === 'buddiesMenu') renderBuddies();
        else if (currentActiveMenuId === 'messagesMenu') renderMessages();
        alert('Buddy removed.');
    }
    function removeMessageThread(buddyEmail) { 
        if (!confirm('Delete this chat history?')) return;
        messages = messages.filter(m => m.buddyEmail !== buddyEmail);
        saveMessages();
        if (activeChatBuddyEmail === buddyEmail) { clearContentAreaToWelcome(); activeChatBuddyEmail = null; }
        renderMessages();
        alert('Chat history deleted.');
    }
    
    function saveBuddies() { 
        let data = JSON.parse(localStorage.getItem('buddiesData')) || {};
        data[currentUser.email] = buddies;
        localStorage.setItem('buddiesData', JSON.stringify(data));
    }
    function saveMessages() { 
        let data = JSON.parse(localStorage.getItem('messagesData')) || {};
        data[currentUser.email] = messages;
        localStorage.setItem('messagesData', JSON.stringify(data));
    }

    function clearContentAreaToWelcome(messageHTML = `<p id="welcomeMessage">Welcome, ${currentUser.profile.name || currentUser.username}!</p>`) {
        activeChatBuddyEmail = null; 
        contentArea.innerHTML = messageHTML;
    }
    
    function handleInitialView() {
        const hash = window.location.hash.substring(1);
        if (hash === 'messages' && messagesMenu) messagesMenu.click();
        else if (hash === 'buddies' && buddiesMenu) buddiesMenu.click();
        else { 
            clearContentAreaToWelcome(); 
            if(buddiesMenu) setActiveMenu('buddiesMenu'); 
            renderBuddies(); 
        }
    }
    handleInitialView();
});
