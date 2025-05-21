document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = checkLogin(); 
    if (!loggedInUser) return;

    const userAvatarSidebar = document.getElementById('userAvatarSidebar');
    const userNameSidebar = document.getElementById('userNameSidebar');
    const profilePageAvatar = document.getElementById('profilePageAvatar');
    const profilePageName = document.getElementById('profilePageName');
    const profilePageEmail = document.getElementById('profilePageEmail');
    const profilePageUsername = document.getElementById('profilePageUsername');
    const profilePageAboutMe = document.getElementById('profilePageAboutMe'); // New display element
    const profilePageMajor = document.getElementById('profilePageMajor'); 
    const profilePageExpert = document.getElementById('profilePageExpert');
    const profilePageNeedsTutor = document.getElementById('profilePageNeedsTutor');
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileFormContainer = document.getElementById('editProfileFormContainer');
    const editProfileForm = document.getElementById('editProfileForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutMenuProfile = document.getElementById('logoutMenuProfile');

    const editExpertSubjectsContainer = document.getElementById('editExpertSubjects');
    const editNeedsTutorSubjectsContainer = document.getElementById('editNeedsTutorSubjects');
    const editAboutMeTextarea = document.getElementById('editAboutMe'); // New form element

    const allSubjects = ["Math", "Physics", "Biology", "Chemistry", "Computer Science", "History", "English", "Bahasa", "Geography", "Sociology", "Economics", "Art"];


    if (logoutMenuProfile) {
        logoutMenuProfile.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    let currentUserData;

    function populateCheckboxGroup(container, name, selectedValues = []) {
        container.innerHTML = ''; 
        allSubjects.forEach(subject => {
            const div = document.createElement('div');
            div.className = 'checkbox-item-profile'; 
            const checkboxId = `edit_${name}_${subject.toLowerCase().replace(/\s+/g, '')}`;
            const isChecked = selectedValues.includes(subject);
            div.innerHTML = `
                <input type="checkbox" id="${checkboxId}" name="${name}" value="${subject}" ${isChecked ? 'checked' : ''}>
                <label for="${checkboxId}" class="inline-label-profile">${subject}</label>
            `;
            container.appendChild(div);
        });
    }

    function loadProfileData() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        currentUserData = users.find(u => u.email === loggedInUser.email);

        if (!currentUserData) {
            console.error("Could not find current user data.");
            currentUserData = loggedInUser; 
            if (!currentUserData.profile) {
                 currentUserData.profile = { 
                    name: loggedInUser.username, 
                    avatar: 'images/default_avatar.png', 
                    aboutMe: '', // Default aboutMe
                    major: 'Other', 
                    expert: [], 
                    needsTutor: [] 
                };
            }
        }
        
        const profile = currentUserData.profile || { 
            name: currentUserData.username, 
            avatar: 'images/default_avatar.png', 
            aboutMe: '',
            major: 'Other',
            expert: [], 
            needsTutor: [] 
        };

        const avatarSrc = profile.avatar || 'images/default_avatar.png';
        const displayName = profile.name || currentUserData.username;

        if (userAvatarSidebar) userAvatarSidebar.src = avatarSrc;
        if (userNameSidebar) userNameSidebar.textContent = displayName;

        if (profilePageAvatar) profilePageAvatar.src = avatarSrc;
        if (profilePageName) profilePageName.textContent = displayName;
        if (profilePageEmail) profilePageEmail.textContent = currentUserData.email;
        if (profilePageUsername) profilePageUsername.textContent = currentUserData.username;
        if (profilePageAboutMe) { // Display About Me
            profilePageAboutMe.textContent = profile.aboutMe || 'Not specified yet. Click \'Edit Profile\' to add a description about yourself.';
            profilePageAboutMe.innerHTML = (profile.aboutMe || 'Not specified yet. Click \'Edit Profile\' to add a description about yourself.').replace(/\n/g, '<br>'); // Render newlines
        }
        if (profilePageMajor) profilePageMajor.textContent = profile.major || 'Not specified';
        
        if (profilePageExpert) profilePageExpert.textContent = profile.expert && profile.expert.length > 0 ? profile.expert.join(', ') : 'Not specified';
        if (profilePageNeedsTutor) profilePageNeedsTutor.textContent = profile.needsTutor && profile.needsTutor.length > 0 ? profile.needsTutor.join(', ') : 'Not specified';

        // Pre-fill edit form
        document.getElementById('editName').value = displayName;
        document.getElementById('editAvatar').value = profile.avatar || '';
        if (editAboutMeTextarea) editAboutMeTextarea.value = profile.aboutMe || ''; // Pre-fill About Me textarea
        document.getElementById('editMajor').value = profile.major || 'Other'; 

        populateCheckboxGroup(editExpertSubjectsContainer, 'expert', profile.expert || []);
        populateCheckboxGroup(editNeedsTutorSubjectsContainer, 'needsTutor', profile.needsTutor || []);
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            editProfileFormContainer.classList.add('visible');
            editProfileBtn.style.display = 'none';
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editProfileFormContainer.classList.remove('visible');
            editProfileBtn.style.display = 'block';
            loadProfileData(); 
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newName = document.getElementById('editName').value.trim();
            let newAvatar = document.getElementById('editAvatar').value.trim();
            if (newAvatar === '') newAvatar = 'images/default_avatar.png';
            const newAboutMe = editAboutMeTextarea ? editAboutMeTextarea.value.trim() : ''; // Get new About Me
            const newMajor = document.getElementById('editMajor').value; 

            const newExpertCheckboxes = editExpertSubjectsContainer.querySelectorAll('input[name="expert"]:checked');
            const newExpert = Array.from(newExpertCheckboxes).map(cb => cb.value);

            const newNeedsTutorCheckboxes = editNeedsTutorSubjectsContainer.querySelectorAll('input[name="needsTutor"]:checked');
            const newNeedsTutor = Array.from(newNeedsTutorCheckboxes).map(cb => cb.value);

            const users = JSON.parse(localStorage.getItem('users'));
            const userIndex = users.findIndex(u => u.email === loggedInUser.email);

            if (userIndex !== -1) {
                const existingProfile = users[userIndex].profile || {};
                users[userIndex].profile = {
                    ...existingProfile, 
                    name: newName || users[userIndex].username,
                    avatar: newAvatar,
                    aboutMe: newAboutMe, // Save new About Me
                    major: newMajor, 
                    expert: newExpert,
                    needsTutor: newNeedsTutor
                };
                
                localStorage.setItem('users', JSON.stringify(users));
                const updatedLoggedInUser = { ...loggedInUser, profile: users[userIndex].profile };
                localStorage.setItem('loggedInUser', JSON.stringify(updatedLoggedInUser)); 
                
                loadProfileData(); 
                editProfileFormContainer.classList.remove('visible');
                editProfileBtn.style.display = 'block';
                alert('Profile updated successfully!');
            } else {
                alert('Error updating profile. User not found.');
            }
        });
    }
    
    loadProfileData();
});