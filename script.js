class WorldClock {
    constructor() {
        this.cities = [
            { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France' },
            { id: 'new-york', name: 'New York', timezone: 'America/New_York', country: 'États-Unis' },
            { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japon' },
            { id: 'lagos', name: 'Lagos', timezone: 'Africa/Lagos', country: 'Nigéria' },
            { id: 'london', name: 'Londres', timezone: 'Europe/London', country: 'Royaume-Uni' },
            { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australie' },
            { id: 'dubai', name: 'Dubaï', timezone: 'Asia/Dubai', country: 'Émirats Arabes Unis' },
            { id: 'singapore', name: 'Singapour', timezone: 'Asia/Singapore', country: 'Singapour' },
            { id: 'los-angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'États-Unis' },
            { id: 'hong-kong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'Chine' },
            { id: 'mumbai', name: 'Mumbai', timezone: 'Asia/Kolkata', country: 'Inde' },
            { id: 'sao-paulo', name: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brésil' },
            { id: 'moscow', name: 'Moscou', timezone: 'Europe/Moscow', country: 'Russie' },
            { id: 'cairo', name: 'Le Caire', timezone: 'Africa/Cairo', country: 'Égypte' },
            { id: 'mexico-city', name: 'Mexico', timezone: 'America/Mexico_City', country: 'Mexique' }
        ];
        
        this.activeCities = ['paris', 'new-york', 'tokyo', 'lagos'];
        this.is24Hour = true;
        this.updateInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupHTML();
        this.bindEvents();
        this.renderClocks();
        this.startClock();
    }
    
    setupHTML() {
        const main = document.querySelector('.main .container');
        const controlsHTML = `
            <div class="controls">
                <div class="format-toggle">
                    <label for="formatToggle">Format 24h</label>
                    <div class="toggle-switch active" id="formatToggle"></div>
                </div>
                <button class="add-city-btn" id="addCityBtn">
                    <span>+</span>
                    <span>Ajouter une ville</span>
                </button>
            </div>
        `;
        
        const modalHTML = `
            <div class="modal" id="cityModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Ajouter une ville</h2>
                        <button class="close-modal" id="closeModal">×</button>
                    </div>
                    <div class="city-list" id="cityList"></div>
                </div>
            </div>
        `;
        
        main.insertAdjacentHTML('afterbegin', controlsHTML);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    bindEvents() {
        const formatToggle = document.getElementById('formatToggle');
        const addCityBtn = document.getElementById('addCityBtn');
        const closeModal = document.getElementById('closeModal');
        const modal = document.getElementById('cityModal');
        
        formatToggle.addEventListener('click', () => {
            this.is24Hour = !this.is24Hour;
            formatToggle.classList.toggle('active');
            document.querySelector('.format-toggle label').textContent = 
                this.is24Hour ? 'Format 24h' : 'Format 12h';
            this.renderClocks();
        });
        
        addCityBtn.addEventListener('click', () => {
            this.showCityModal();
        });
        
        closeModal.addEventListener('click', () => {
            this.hideCityModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCityModal();
            }
        });
    }
    
    showCityModal() {
        const modal = document.getElementById('cityModal');
        const cityList = document.getElementById('cityList');
        
        const availableCities = this.cities.filter(city => !this.activeCities.includes(city.id));
        
        cityList.innerHTML = availableCities.map(city => `
            <div class="city-option" data-city-id="${city.id}">
                <div>
                    <div class="city-option-name">${city.name}</div>
                    <div class="city-option-timezone">${city.timezone} • ${city.country}</div>
                </div>
            </div>
        `).join('');
        
        cityList.addEventListener('click', (e) => {
            const cityOption = e.target.closest('.city-option');
            if (cityOption) {
                const cityId = cityOption.dataset.cityId;
                this.addCity(cityId);
                this.hideCityModal();
            }
        });
        
        modal.classList.add('active');
    }
    
    hideCityModal() {
        const modal = document.getElementById('cityModal');
        modal.classList.remove('active');
    }
    
    addCity(cityId) {
        if (!this.activeCities.includes(cityId)) {
            this.activeCities.push(cityId);
            this.renderClocks();
        }
    }
    
    removeCity(cityId) {
        this.activeCities = this.activeCities.filter(id => id !== cityId);
        this.renderClocks();
    }
    
    renderClocks() {
        const clockGrid = document.getElementById('clockGrid');
        
        const clocksHTML = this.activeCities.map(cityId => {
            const city = this.cities.find(c => c.id === cityId);
            if (!city) return '';
            
            const timeData = this.getTimeForTimezone(city.timezone);
            const timeDiff = this.getTimeDifference(city.timezone);
            
            return `
                <div class="clock-card" data-city-id="${city.id}">
                    <div class="clock-header">
                        <div class="city-info">
                            <div class="city-name">${city.name}</div>
                            <div class="timezone">${city.timezone}</div>
                        </div>
                        <button class="remove-btn" data-city-id="${city.id}" title="Supprimer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="clock-display">
                        <div class="time" data-timezone="${city.timezone}">${timeData.time}</div>
                        <div class="date">${timeData.date}</div>
                    </div>
                    <div class="clock-info">
                        <div class="time-difference">${timeDiff}</div>
                        <div class="day-night">
                            <div class="day-indicator ${timeData.isDay ? 'day' : 'night'}"></div>
                            <span>${timeData.isDay ? 'Jour' : 'Nuit'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        clockGrid.innerHTML = clocksHTML;
        
        this.bindClockEvents();
    }
    
    bindClockEvents() {
        const removeButtons = document.querySelectorAll('.remove-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cityId = btn.dataset.cityId;
                this.removeCity(cityId);
            });
        });
    }
    
    getTimeForTimezone(timezone) {
        const now = new Date();
        const options = {
            timeZone: timezone,
            hour12: !this.is24Hour,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const dateOptions = {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const timeString = now.toLocaleTimeString('fr-FR', options);
        const dateString = now.toLocaleDateString('fr-FR', dateOptions);
        
        const hour = parseInt(now.toLocaleTimeString('fr-FR', { 
            timeZone: timezone, 
            hour: '2-digit', 
            hour12: false 
        }));
        
        const isDay = hour >= 6 && hour < 18;
        
        return {
            time: timeString,
            date: dateString,
            isDay: isDay
        };
    }
    
    getTimeDifference(timezone) {
        const now = new Date();
        const localTime = now.getTime();
        const targetTime = new Date(now.toLocaleString("en-US", {timeZone: timezone})).getTime();
        const localOffset = now.getTimezoneOffset() * 60000;
        
        const targetDate = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
        const localDate = new Date(now.toLocaleString("en-US"));
        
        const diffHours = Math.round((targetDate - localDate) / (1000 * 60 * 60));
        
        if (diffHours === 0) {
            return 'Même heure';
        } else if (diffHours > 0) {
            return `+${diffHours}h`;
        } else {
            return `${diffHours}h`;
        }
    }
    
    updateClocks() {
        const timeElements = document.querySelectorAll('.time[data-timezone]');
        timeElements.forEach(element => {
            const timezone = element.dataset.timezone;
            const timeData = this.getTimeForTimezone(timezone);
            element.textContent = timeData.time;
            
            const clockCard = element.closest('.clock-card');
            if (clockCard) {
                const dateElement = clockCard.querySelector('.date');
                const dayNightElement = clockCard.querySelector('.day-night');
                const timeDiffElement = clockCard.querySelector('.time-difference');
                
                if (dateElement) dateElement.textContent = timeData.date;
                if (dayNightElement) {
                    const indicator = dayNightElement.querySelector('.day-indicator');
                    const text = dayNightElement.querySelector('span');
                    indicator.className = `day-indicator ${timeData.isDay ? 'day' : 'night'}`;
                    text.textContent = timeData.isDay ? 'Jour' : 'Nuit';
                }
                if (timeDiffElement) timeDiffElement.textContent = this.getTimeDifference(timezone);
            }
        });
    }
    
    startClock() {
        this.updateClocks();
        this.updateInterval = setInterval(() => {
            this.updateClocks();
        }, 1000);
    }
    
    stopClock() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WorldClock();
});