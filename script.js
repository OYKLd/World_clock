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

        const savedCities = localStorage.getItem('activeCities');
        if (savedCities) {
            this.activeCities = JSON.parse(savedCities);
        } else {
            this.setDefaultCities();
        }

        this.renderClocks();
        this.startClock();
        this.isLoading = false;
    }


    getFallbackTimezone(countryCode) {
        const map = {
            FR: 'Europe/Paris',
            GB: 'Europe/London',
            IE: 'Europe/Dublin',
            DE: 'Europe/Berlin',
            ES: 'Europe/Madrid',
            IT: 'Europe/Rome',
            NL: 'Europe/Amsterdam',
            BE: 'Europe/Brussels',
            CH: 'Europe/Zurich',

            US: 'America/New_York',
            CA: 'America/Toronto',
            MX: 'America/Mexico_City',
            BR: 'America/Sao_Paulo',
            AR: 'America/Argentina/Buenos_Aires',

            JP: 'Asia/Tokyo',
            CN: 'Asia/Shanghai',
            KR: 'Asia/Seoul',
            IN: 'Asia/Kolkata',
            TH: 'Asia/Bangkok',

            AU: 'Australia/Sydney',
            NZ: 'Pacific/Auckland',

            RU: 'Europe/Moscow',
            TR: 'Europe/Istanbul',
            ZA: 'Africa/Johannesburg'
        };

        return map[countryCode] || null;
    }

    setDefaultCities() {
        const defaultCityNames = ['Paris', 'New York', 'Tokyo', 'London'];
        defaultCityNames.forEach(name => {
            const city = this.allCities.find(c => c.name === name);
            if (city) this.activeCities.push(city.id);
        });

        if (this.activeCities.length === 0) {
            this.activeCities = ['fr-paris', 'us-new-york', 'jp-tokyo', 'gb-london'];
            this.allCities = [
                { id: 'fr-paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France', countryCode: 'FR' },
                { id: 'us-new-york', name: 'New York', timezone: 'America/New_York', country: 'États-Unis', countryCode: 'US' },
                { id: 'jp-tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japon', countryCode: 'JP' },
                { id: 'gb-london', name: 'London', timezone: 'Europe/London', country: 'Royaume-Uni', countryCode: 'GB' }
            ];
        }
    }

    setupHTML() {
        const main = document.querySelector('.main .container');

        main.insertAdjacentHTML('afterbegin', `
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
        `);
    }

    bindEvents() {
        document.getElementById('formatToggle').addEventListener('click', e => {
            this.is24Hour = !this.is24Hour;
            e.target.classList.toggle('active');
            document.querySelector('.format-toggle label').textContent =
                this.is24Hour ? 'Format 24h' : 'Format 12h';
            this.renderClocks();
        });

        document.getElementById('addCityBtn').onclick = () => this.showCityModal();
        document.getElementById('closeModal').onclick = () => this.hideCityModal();

        document.getElementById('citySearch').addEventListener('input', e => {
            this.filterCities(e.target.value);
        });
    }

    showCityModal() {
        document.getElementById('cityModal').classList.add('active');
        this.filterCities('');
    }

    hideCityModal() {
        document.getElementById('cityModal').classList.remove('active');
    }

    addCity(cityId) {
        if (!this.activeCities.includes(cityId)) {
            this.activeCities.push(cityId);
            localStorage.setItem('activeCities', JSON.stringify(this.activeCities));
            this.renderClocks();
        }
    }

    removeCity(cityId) {
        this.activeCities = this.activeCities.filter(id => id !== cityId);
        localStorage.setItem('activeCities', JSON.stringify(this.activeCities));
        this.renderClocks();
    }

    renderClocks() {
        const grid = document.getElementById('clockGrid');

        if (!this.activeCities.length) {
            grid.innerHTML = `<p>Aucune ville sélectionnée</p>`;
            return;
        }

        grid.innerHTML = this.activeCities.map(id => {
            const city = this.allCities.find(c => c.id === id);
            if (!city) return '';

            const t = this.getTimeForTimezone(city.timezone);
            const diff = this.getTimeDifference(city.timezone);

            return `
                <div class="clock-card">
                    <button class="remove-btn" data-id="${id}">✕</button>
                    <strong>${city.name}</strong>
                    <div>${t.time}</div>
                    <small>${t.date}</small>
                    <div>${diff}</div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => this.removeCity(btn.dataset.id);
        });
    }

    getTimeForTimezone(timezone) {
        const now = new Date();

        try {
            const time = now.toLocaleTimeString('fr-FR', {
                timeZone: timezone,
                hour12: !this.is24Hour,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const date = now.toLocaleDateString('fr-FR', {
                timeZone: timezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const hour = Number(
                now.toLocaleTimeString('fr-FR', {
                    timeZone: timezone,
                    hour: '2-digit',
                    hour12: false
                })
            );

            return { time, date, isDay: hour >= 6 && hour < 18 };

        } catch {
            return { time: '--:--:--', date: 'Fuseau invalide', isDay: true };
        }
    }

    getTimeDifference(timezone) {
        try {
            const now = new Date();
            const target = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            const local = new Date(now.toLocaleString('en-US'));
            const diff = Math.round((target - local) / 36e5);
            return diff === 0 ? 'Même heure' : `${diff > 0 ? '+' : ''}${diff}h`;
        } catch {
            return '—';
        }
    }

    startClock() {
        this.updateInterval = setInterval(() => this.renderClocks(), 1000);
    }

    async loadAllCitiesFromAPI() {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,timezones,cca2,translations');
        const countries = await res.json();
        this.allCities = [];

        countries.forEach(country => {
            if (!country.capital || !country.timezones) return;

            let timezone = country.timezones.find(tz => {
                try {
                    Intl.DateTimeFormat('en-US', { timeZone: tz });
                    return true;
                } catch {
                    return false;
                }
            });

            if (!timezone) {
                timezone = this.getFallbackTimezone(country.cca2);
            }

            if (!timezone) return;

            const countryName = country.translations?.fra?.common || country.name.common;

            country.capital.forEach(capital => {
                this.allCities.push({
                    id: `${country.cca2.toLowerCase()}-${capital.toLowerCase().replace(/\s+/g, '-')}`,
                    name: capital,
                    timezone,
                    country: countryName,
                    countryCode: country.cca2
                });
            });
        });

        this.allCities.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        console.log(`${this.allCities.length} villes chargées avec succès`);
    }

    filterCities(term) {
        const list = document.getElementById('cityList');

        const results = this.allCities.filter(c =>
            !this.activeCities.includes(c.id) &&
            (c.name.toLowerCase().includes(term.toLowerCase()) ||
             c.country.toLowerCase().includes(term.toLowerCase()))
        ).slice(0, 30);

        if (!results.length) {
            list.innerHTML = '<div>Aucune ville trouvée</div>';
            return;
        }

        list.innerHTML = results.map(c => `
            <div class="city-option" data-id="${c.id}">
                <strong>${c.name}</strong> – ${c.country}
            </div>
        `).join('');

        list.querySelectorAll('.city-option').forEach(el => {
            el.onclick = () => {
                this.addCity(el.dataset.id);
                this.hideCityModal();
            };
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WorldClock();
});
