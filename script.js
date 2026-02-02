class WorldClock {
    constructor() {
        this.allCities = [];
        this.activeCities = [];
        this.is24Hour = true;
        this.updateInterval = null;
        this.isLoading = true;
        
        this.init();
    }
    
    async init() {
        this.setupHTML();
        this.bindEvents();
        await this.loadAllCitiesFromAPI();
        
        // Charger les villes actives depuis le localStorage ou utiliser des villes par défaut
        const savedCities = localStorage.getItem('activeCities');
        if (savedCities) {
            this.activeCities = JSON.parse(savedCities);
        } else {
            // Villes par défaut si aucune n'est sauvegardée
            this.setDefaultCities();
        }
        
        this.renderClocks();
        this.startClock();
        this.isLoading = false;
    }
    
    setDefaultCities() {
        // Chercher quelques villes par défaut dans la liste chargée
        const defaultCityNames = ['Paris', 'New York', 'Tokyo', 'London'];
        defaultCityNames.forEach(cityName => {
            const city = this.allCities.find(c => c.name === cityName);
            if (city) {
                this.activeCities.push(city.id);
            }
        });
        
        // Si aucune ville n'a été trouvée (API échouée), utiliser des villes statiques
        if (this.activeCities.length === 0) {
            this.activeCities = [
                'fr-paris',
                'us-washington',
                'jp-tokyo',
                'gb-london'
            ];
            
            // Ajouter ces villes statiques à allCities
            this.allCities = [
                { id: 'fr-paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France', countryCode: 'FR' },
                { id: 'us-washington', name: 'Washington', timezone: 'America/New_York', country: 'États-Unis', countryCode: 'US' },
                { id: 'jp-tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japon', countryCode: 'JP' },
                { id: 'gb-london', name: 'London', timezone: 'Europe/London', country: 'Royaume-Uni', countryCode: 'GB' }
            ];
        }
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
                    <div class="search-container">
                        <input type="text" id="citySearch" placeholder="Rechercher un pays ou une ville..." class="search-input">
                    </div>
                    <div class="city-list" id="cityList">
                        <div class="loading">Chargement des villes...</div>
                    </div>
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
        const citySearch = document.getElementById('citySearch');
        
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
        
        citySearch.addEventListener('input', (e) => {
            this.filterCities(e.target.value);
        });
    }
    
    showCityModal() {
        const modal = document.getElementById('cityModal');
        const citySearch = document.getElementById('citySearch');
        
        citySearch.value = '';
        this.filterCities('');
        
        modal.classList.add('active');
        citySearch.focus();
    }
    
    hideCityModal() {
        const modal = document.getElementById('cityModal');
        modal.classList.remove('active');
    }
    
    addCity(cityId) {
        if (!this.activeCities.includes(cityId)) {
            this.activeCities.push(cityId);
            this.saveActiveCities();
            this.renderClocks();
        }
    }
    
    removeCity(cityId) {
        this.activeCities = this.activeCities.filter(id => id !== cityId);
        this.saveActiveCities();
        this.renderClocks();
    }
    
    saveActiveCities() {
        localStorage.setItem('activeCities', JSON.stringify(this.activeCities));
    }
    
    renderClocks() {
        const clockGrid = document.getElementById('clockGrid');
        
        if (this.activeCities.length === 0) {
            clockGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">Aucune ville sélectionnée</p>
                    <p>Cliquez sur "Ajouter une ville" pour commencer</p>
                </div>
            `;
            return;
        }
        
        const clocksHTML = this.activeCities.map(cityId => {
            const city = this.allCities.find(c => c.id === cityId);
            if (!city) return '';
            
            const timeData = this.getTimeForTimezone(city.timezone);
            const timeDiff = this.getTimeDifference(city.timezone);
            
            return `
                <div class="clock-card" data-city-id="${city.id}">
                    <div class="clock-header">
                        <div class="city-info">
                            <div class="city-name">${city.name}</div>
                            <div class="timezone">${city.country}</div>
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
    
    async loadAllCitiesFromAPI() {
        const cityList = document.getElementById('cityList');
        cityList.innerHTML = '<div class="loading">Chargement des villes du monde entier...</div>';
        
        try {
            // Charger tous les pays avec leurs informations
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,timezones,cca2,translations');
            const countries = await response.json();
            
            this.allCities = [];
            
            countries.forEach(country => {
                // Récupérer le nom du pays en français
                const countryName = country.name.translations?.fra?.common || country.name.common;
                
                // Pour chaque capitale du pays
                if (country.capital && country.timezones && country.timezones.length > 0) {
                    country.capital.forEach((capital, index) => {
                        // Utiliser le premier timezone valide (pas UTC)
                        const timezone = country.timezones.find(tz => !tz.includes('UTC')) || country.timezones[0];
                        
                        if (timezone) {
                            const cityId = `${country.cca2.toLowerCase()}-${capital.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                            
                            this.allCities.push({
                                id: cityId,
                                name: capital,
                                timezone: timezone,
                                country: countryName,
                                countryCode: country.cca2
                            });
                        }
                    });
                }
            });
            
            // Trier par nom de ville
            this.allCities.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
            
            console.log(`${this.allCities.length} villes chargées avec succès`);
            
        } catch (error) {
            console.error('Erreur lors du chargement des villes:', error);
            cityList.innerHTML = `
                <div class="no-results">
                    <p>Erreur lors du chargement des villes</p>
                    <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Veuillez réessayer plus tard</p>
                </div>
            `;
        }
    }
    
    filterCities(searchTerm) {
        const cityList = document.getElementById('cityList');
        
        if (this.allCities.length === 0) {
            cityList.innerHTML = '<div class="loading">Chargement des villes...</div>';
            return;
        }
        
        const filteredCities = this.allCities.filter(city => 
            !this.activeCities.includes(city.id) &&
            (city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             city.country.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        if (filteredCities.length === 0) {
            cityList.innerHTML = '<div class="no-results">Aucune ville trouvée</div>';
            return;
        }
        
        // Afficher les 30 premiers résultats
        cityList.innerHTML = filteredCities.slice(0, 30).map(city => `
            <div class="city-option" data-city-id="${city.id}">
                <div>
                    <div class="city-option-name">${city.name}</div>
                    <div class="city-option-timezone">${city.timezone} • ${city.country}</div>
                </div>
            </div>
        `).join('');
        
        // Bind des événements de clic
        const cityOptions = cityList.querySelectorAll('.city-option');
        cityOptions.forEach(option => {
            option.addEventListener('click', () => {
                const cityId = option.dataset.cityId;
                this.addCity(cityId);
                this.hideCityModal();
            });
        });
    }
}

// Initialiser l'horloge mondiale au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new WorldClock();
});