class Card{
    constructor({
        imageUrl,
        cardData, 
        onDismiss, 
        onLike,
        onDislike
    }){
        this.imageUrl = imageUrl;
        this.cardData = cardData; 
        this.onDismiss = onDismiss;
        this.onLike = onLike;
        this.onDislike = onDislike;
        this.#init();
    }

    #startPoint;
    #offsetX;
    #offsetY;

    #init = () => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        const img = document.createElement('img');
        img.src = this.imageUrl;
        img.alt = `${this.cardData.name || 'User'}'s photo`; 
        card.append(img);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('card-info');
        infoDiv.innerHTML = `
            <h3 class="card-name">${this.cardData.name || 'N/A'}</h3>
            <p><strong>Level:</strong> <span class="card-school">${this.cardData.level || 'N/A'}</span></p>
            <p><strong>Major:</strong> <span class="card-major">${this.cardData.major || 'N/A'}</span></p> <!-- Added Major -->
            <p><strong>Expert in:</strong> <span class="card-good-at">${this.cardData.expert && this.cardData.expert.length > 0 ? this.cardData.expert.join(', ') : 'Not specified'}</span></p>
            <p><strong>Needs help with:</strong> <span class="card-need">${this.cardData.needsTutor && this.cardData.needsTutor.length > 0 ? this.cardData.needsTutor.join(', ') : 'Not specified'}</span></p>
        `;
        // Removed Age from card for brevity, can be added back if needed
        // <p><strong>Age:</strong> <span class="card-age">${this.cardData.age || 'N/A'}</span></p>
        card.append(infoDiv);

        this.element = card;
        this.element.__cardInstance = this; 
        this.#listenToMouseEvents();
    }

    #listenToMouseEvents = () => {
        this.element.addEventListener('mousedown', e => {
            if (this.element.style.getPropertyValue('--i') !== '0' && this.element.parentElement.querySelectorAll('.card:not(.dismissing)').length > 1) {
                 if (parseInt(this.element.style.getPropertyValue('--i'), 10) > 0) return;
            }

            const {clientX, clientY} = e;
            this.#startPoint = { x: clientX, y: clientY };
            this.element.style.transition = 'transform 0.05s linear'; 
            document.addEventListener('mousemove', this.#handleMouseMove);
        });

        document.addEventListener('mouseup', this.#handleMouseUp);

        this.element.addEventListener('dragstart', e =>{
            e.preventDefault();
        });
    }   

    #handleMouseMove = (e) => {
        if(!this.#startPoint) return;
        e.preventDefault(); 
        const {clientX, clientY} = e;
        this.#offsetX = clientX - this.#startPoint.x;
        this.#offsetY = clientY - (this.element.getBoundingClientRect().top + (this.element.offsetHeight / 2));

        const rotateFactor = 0.08; 
        const rotate = this.#offsetX * rotateFactor;

        this.element.style.transform = `translate(${this.#offsetX}px, ${this.#offsetY}px) rotate(${rotate}deg)`;

        const likeThreshold = 0.3; 
        const dislikeThreshold = -0.3;

        if (this.#offsetX > this.element.clientWidth * likeThreshold) { 
            document.getElementById('like').style.opacity = '1';
            document.getElementById('like').style.transform = 'scale(1.1)';
            document.getElementById('dislike').style.opacity = '0.5';
            document.getElementById('dislike').style.transform = 'scale(1)';
        } else if (this.#offsetX < this.element.clientWidth * dislikeThreshold) { 
            document.getElementById('dislike').style.opacity = '1';
            document.getElementById('dislike').style.transform = 'scale(1.1)';
            document.getElementById('like').style.opacity = '0.5';
            document.getElementById('like').style.transform = 'scale(1)';
        } else {
            document.getElementById('like').style.opacity = '0.6';
            document.getElementById('like').style.transform = 'scale(1)';
            document.getElementById('dislike').style.opacity = '0.6';
            document.getElementById('dislike').style.transform = 'scale(1)';
        }

        if(Math.abs(this.#offsetX) > this.element.clientWidth * 0.55){ 
            this.#dismiss(this.#offsetX > 0 ? 1 : -1);
        }
    }

    #handleMouseUp = (e) => {
        if (!this.#startPoint) return;
        this.#startPoint = null;
        document.removeEventListener('mousemove', this.#handleMouseMove);
        
        document.getElementById('like').style.opacity = '0.6';
        document.getElementById('like').style.transform = 'scale(1)';
        document.getElementById('dislike').style.opacity = '0.6';
        document.getElementById('dislike').style.transform = 'scale(1)';

        this.element.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; 
        this.element.style.transform = ''; 
    }

    #dismiss = (direction) => {
        if (!this.element.classList.contains('dismissing')) { 
            this.#startPoint = null;
            document.removeEventListener('mousemove', this.#handleMouseMove);

            this.element.style.transition = 'transform 0.7s ease-out, opacity 0.6s ease-out';
            const flyOutX = direction * (window.innerWidth * 0.75); 
            const flyOutY = this.#offsetY !== undefined ? this.#offsetY : (Math.random() * 100 - 50); 
            const flyOutRotate = 45 * direction; 
            
            this.element.style.transform = `translate(${flyOutX}px, ${flyOutY}px) rotate(${flyOutRotate}deg)`;
            this.element.style.opacity = '0';
            this.element.classList.add('dismissing');
            
            setTimeout(() => {
                if (this.element) this.element.remove();
            }, 700);

            if(typeof this.onDismiss === 'function'){
                this.onDismiss();
            }
            
            if(direction === 1){
                if(typeof this.onLike === 'function') this.onLike(this.cardData);
            } else {
                if(typeof this.onDislike === 'function') this.onDislike(this.cardData);
            }
        }
    }

    publicDismiss(direction) {
        this.#offsetX = direction * 30; 
        this.#offsetY = 0; 
        this.#dismiss(direction);
    }
}