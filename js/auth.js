// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize localStorage if not already present
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('buddiesData')) {
        localStorage.setItem('buddiesData', JSON.stringify({}));
    }
    if (!localStorage.getItem('messagesData')) {
        localStorage.setItem('messagesData', JSON.stringify({}));
    }
     if (!localStorage.getItem('discoverableUsers')) {
        // Pre-populate some discoverable users
        const initialDiscoverableUsers = [
            { name: 'Alex Ray', age: 19, level: 'College Freshman', major: 'Science', expert: ['Physics', 'Calculus'], needsTutor: ['Literature'], photo: 'images/andy.jpg', email: 'alex@example.com', username: 'alexray' },
            { name: 'Mia Wong', age: 17, level: 'SMA Kelas 2', major: 'Science', expert: ['Chemistry', 'Biology'], needsTutor: ['History'], photo: 'images/mia.jpg', email: 'mia@example.com', username: 'miaw' },
            { name: 'Samira Khan', age: 16, level: 'SMA Kelas 1', major: 'Science', expert: ['Computer Science'], needsTutor: ['Art History'], photo: 'images/Samira.jpg', email: 'samira@example.com', username: 'samkhan' },
            { name: 'Leo Chen', age: 18, level: 'SMA Kelas 3', major: 'Social', expert: ['Economics', 'Statistics'], needsTutor: ['French'], photo: 'images/leo.jpg', email: 'leo@example.com', username: 'leochen' },
            { name: 'Kara Danvers', age: 20, level: 'University Year 2', major: 'Other', expert: ['Journalism', 'Cryptography'], needsTutor: ['Astrophysics'], photo: 'images/kara.jpg', email: 'kara@example.com', username: 'superkara' },
            { name: 'Ben Tennyson', age: 16, level: 'High School', major: 'Other', expert: ['Alien Tech', 'Heroics'], needsTutor: ['Math', 'English Lit.'], photo: 'images/ben.jpg', email: 'ben10@example.com', username: 'ben10hero' }
        ];
        localStorage.setItem('discoverableUsers', JSON.stringify(initialDiscoverableUsers));
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    // Function to display messages
    function showMessage(element, text, isError = true) {
        if (element) {
            element.textContent = text;
            element.style.display = 'block'; // Make sure it's visible
            if (isError) {
                element.classList.remove('success-message'); 
                element.classList.add('error-message');
            } else {
                element.classList.remove('error-message');
                element.classList.add('success-message'); 
            }
        }
    }


    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const users = JSON.parse(localStorage.getItem('users'));
            
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                window.location.href = 'main.html';
            } else {
                showMessage(loginMessage, 'Invalid email or password.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {    
            e.preventDefault();
            const username = registerForm.username.value.trim();
            const email = registerForm.email.value.trim();
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            const majorElement = registerForm.querySelector('input[name="major"]:checked');
            const major = majorElement ? majorElement.value : null;

            const needsTutorCheckboxes = registerForm.querySelectorAll('input[name="needsTutor"]:checked');
            const needsTutor = Array.from(needsTutorCheckboxes).map(cb => cb.value);

            const expertCheckboxes = registerForm.querySelectorAll('input[name="expert"]:checked');
            const expert = Array.from(expertCheckboxes).map(cb => cb.value);


            if (!username || !email || !password || !major) { // Added major to required check
                 showMessage(registerMessage, 'All fields including major are required.');
                 return;
            }
            if (password !== confirmPassword) {
                showMessage(registerMessage, 'Passwords do not match.');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users'));
            if (users.find(u => u.email === email)) {
                showMessage(registerMessage, 'Email already registered.');
                return;
            }
            if (users.find(u => u.username === username)) {
                showMessage(registerMessage, 'Username already taken.');
                return;
            }
            
            const newUser = { 
                username, 
                email, 
                password, 
                profile: { 
                    name: username, 
                    avatar: 'images/default_avatar.png', 
                    expert: expert,
                    needsTutor: needsTutor,
                    major: major,
                    age: null, 
                    level: null
                }
            };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            const buddiesData = JSON.parse(localStorage.getItem('buddiesData'));
            buddiesData[email] = []; 
            localStorage.setItem('buddiesData', JSON.stringify(buddiesData));

            const messagesData = JSON.parse(localStorage.getItem('messagesData'));
            messagesData[email] = [];
            localStorage.setItem('messagesData', JSON.stringify(messagesData));

            showMessage(registerMessage, 'Registration successful! Redirecting to login...', false); 
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000); 
        });
    }
});

function checkLogin() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');

    if (!loggedInUser && !isAuthPage) {
        window.location.href = 'login.html';
        return null;
    }
    if (loggedInUser && isAuthPage) { 
        window.location.href = 'main.html';
        return loggedInUser; 
    }
    return loggedInUser;
}

function logoutUser() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

checkLogin();