// js/swiper_script.js
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = checkLogin(); 
    if (!loggedInUser) {
        // checkLogin already handles redirection
        return;
    }

    const swiper = document.querySelector('#swiper');
    const likeIcon = document.querySelector('#like');
    const dislikeIcon = document.querySelector('#dislike');
    const backToMainBtn = document.getElementById('backToMainBtn');

    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            window.location.href = 'main.html';
        });
    }

    let discoverableUsers = JSON.parse(localStorage.getItem('discoverableUsers')) || [];
    const currentUserEmail = loggedInUser.email;
    
    discoverableUsers = discoverableUsers.filter(user => user.email !== currentUserEmail);

    const buddiesData = JSON.parse(localStorage.getItem('buddiesData')) || {};
    const currentUserBuddies = buddiesData[currentUserEmail] || [];
    const currentUserBuddyEmails = currentUserBuddies.map(b => b.email);

    discoverableUsers = discoverableUsers.filter(
        user => !currentUserBuddyEmails.includes(user.email)
    );

    let cardStackCount = 0; 
    const MAX_CARDS_DISPLAYED = 3; // Reduced for better visual stacking effect

    function showNoMoreCardsMessage() {
        if (swiper.querySelector('.no-more-cards')) return; // Message already shown

        const message = document.createElement('p');
        message.className = 'no-more-cards'; // Styled in swiper_styles.css
        message.innerHTML = 'No new buddies to discover right now. <br>You might have seen them all or added them as buddies. Check back later!';
        swiper.appendChild(message);
        if (likeIcon) likeIcon.style.display = 'none';
        if (dislikeIcon) dislikeIcon.style.display = 'none';
    }


    function appendNewCard() {
        if (cardStackCount >= MAX_CARDS_DISPLAYED) {
            return; // Don't add more than max visible cards to DOM at once
        }
        
        if (discoverableUsers.length === 0) {
            if (swiper.querySelectorAll('.card:not(.dismissing)').length === 0) {
                showNoMoreCardsMessage();
            }
            return;
        }
        
        const userData = discoverableUsers.shift(); 
        
        if (!userData) { 
             if (swiper.querySelectorAll('.card:not(.dismissing)').length === 0) {
                showNoMoreCardsMessage();
             }
            return;
        }

        const card = new Card({
            imageUrl: userData.photo || 'images/default_avatar.png',
            cardData: userData,
            onDismiss: () => {
                cardStackCount--;
                appendNewCard(); // Add the next card from the queue
                // Ensure swiper updates stacking order for remaining cards
                updateCardStacking(); 
            },
            onLike: (likedUserData) => {
                if (likeIcon) {
                    likeIcon.style.animationPlayState = 'running';
                    likeIcon.classList.toggle('trigger'); 
                    setTimeout(() => {
                        likeIcon.style.animationPlayState = 'paused';
                    }, 1000);
                }
                
                const allBuddiesData = JSON.parse(localStorage.getItem('buddiesData')) || {};
                if (!allBuddiesData[currentUserEmail]) {
                    allBuddiesData[currentUserEmail] = [];
                }
                if (!allBuddiesData[currentUserEmail].find(b => b.email === likedUserData.email)) {
                    allBuddiesData[currentUserEmail].push(likedUserData);
                    localStorage.setItem('buddiesData', JSON.stringify(allBuddiesData));
                    console.log('Liked and added to buddies:', likedUserData.name);
                }
            },
            onDislike: (dislikedUserData) => {
                if (dislikeIcon) {
                    dislikeIcon.style.animationPlayState = 'running';
                    dislikeIcon.classList.toggle('trigger');
                    setTimeout(() => {
                        dislikeIcon.style.animationPlayState = 'paused';
                    }, 1000);
                }
                console.log('Disliked:', dislikedUserData.name);
            },
        });
        console.log(userData.photo);
        swiper.prepend(card.element);
        cardStackCount++;
        updateCardStacking();
    }

    function updateCardStacking() {
        const cards = swiper.querySelectorAll('.card:not(.dismissing)');
        cards.forEach((cardElement, index) => {
            cardElement.style.setProperty('--i', index);
        });
         // If no active cards and no users left, show message
        if (cards.length === 0 && discoverableUsers.length === 0) {
            showNoMoreCardsMessage();
        } else if (cards.length > 0 && swiper.querySelector('.no-more-cards')) {
            // Remove message if cards are back
            swiper.querySelector('.no-more-cards').remove();
            if (likeIcon) likeIcon.style.display = 'inline-block'; // Or 'flex', etc.
            if (dislikeIcon) dislikeIcon.style.display = 'inline-block';
        }
    }

    const initialCardLoad = Math.min(MAX_CARDS_DISPLAYED, discoverableUsers.length);
    if (initialCardLoad > 0) {
        for (let i = 0; i < initialCardLoad; i++) {
            appendNewCard();
        }
    } else {
        showNoMoreCardsMessage();
    }


    if (likeIcon) {
        likeIcon.addEventListener('click', () => {
            const topCardElement = swiper.querySelector('.card:not(.dismissing)');
            if (topCardElement && topCardElement.__cardInstance) {
                topCardElement.__cardInstance.publicDismiss(1); // Use public method
            }
        });
    }

    if (dislikeIcon) {
       dislikeIcon.addEventListener('click', () => {
            const topCardElement = swiper.querySelector('.card:not(.dismissing)');
            if (topCardElement && topCardElement.__cardInstance) {
                topCardElement.__cardInstance.publicDismiss(-1); // Use public method
            }
        });
    }
});