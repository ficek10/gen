
// Konfigurace a data
const employees = {
    "Kolářová Hana": { maxNights: 0, maxRO: 4, canNights: false, minFreeWeekends: 2 },
    "Králová Martina": { maxNights: 2, maxRO: 1, canNights: true, minFreeWeekends: 2 },
    "Vaněčková Dana": { maxNights: 0, maxRO: 0, canNights: false, minFreeWeekends: 2, specialRules: true },
    "Vaňková Vlaďena": { maxNights: 5, maxRO: 4, canNights: true, minFreeWeekends: 2 },
    "Vrkoslavová Irena": { maxNights: 5, maxRO: 4, canNights: true, minFreeWeekends: 1 },
    "Dianová Kristýna": { maxNights: 5, maxRO: 1, canNights: true, minFreeWeekends: 2 },
    "Dráb David": { maxNights: 5, maxRO: 1, canNights: true, minFreeWeekends: 2 },
    "Šáchová Kateřina": { maxNights: 5, maxRO: 4, canNights: true, minFreeWeekends: 2 },
    "Krejčová Zuzana": { maxNights: 2, maxRO: 1, canNights: true, minFreeWeekends: 2 },
    "Dráb Filip": { maxNights: 0, maxRO: 4, canNights: false, minFreeWeekends: 2 },
    "Růžek Přízemí": { maxNights: 31, maxRO: 0, canNights: true, minFreeWeekends: 0, isFloor: true }
};

const shiftTypes = {
    'R': { name: 'Ranní', color: 'rgb(173,216,230)', hours: 7.5 },
    'O': { name: 'Odpolední', color: 'rgb(144,238,144)', hours: 7.5 },
    'L': { name: 'Lékař', color: 'rgb(255,182,193)', hours: 7.5 },
    'IP': { name: 'Individuální péče', color: 'rgb(255,218,185)', hours: 7.5 },
    'RO': { name: 'Ranní+Odpolední', color: 'rgb(221,160,221)', hours: 11.5 },
    'NSK': { name: 'Noční služba staniční', color: 'rgb(255,255,153)', hours: 12, nightStart: 19, nightEnd: 7 },
    'CH': { name: 'Chráněné bydlení', color: 'rgb(255,160,122)', hours: 7.5 },
    'V': { name: 'Volno', color: 'rgb(211,211,211)', hours: 0 },
    'N': { name: 'Noční', color: 'rgb(176,196,222)', hours: 9, nightStart: 21, nightEnd: 6 },
    'S': { name: 'Služba', color: 'rgb(152,251,152)', hours: 7.5 },
    'D': { name: 'Dovolená', color: 'rgb(240,230,140)', hours: 7.5 },
    'IV': { name: 'Individuální výchova', color: 'rgb(230,230,250)', hours: 7.5 },
    'ŠK': { name: 'Školení', color: 'rgb(255,228,196)', hours: 7.5 }
};

const exportColors = {
    'D': 'rgb(144,238,144)',  // zelená
    'N': 'rgb(211,211,211)',  // šedá
    'NSK': 'rgb(173,216,230)' // modrá
};

let shifts = {};
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let employeePreferences = JSON.parse(localStorage.getItem('employeePreferences') || '{}'); // Inicializace z localStorage

document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();

    const isRulesPage = window.location.pathname.includes('rules.html');
    
    if (isRulesPage) {
        generateEmployeeCards();
    } else {
        initializeMonthYearSelects();
        createShiftTable();
        createLegend();
        updateTable();
        generatePreferenceForm();
    }
});

function saveShifts() {
    const monthKey = `shifts_${currentYear}_${currentMonth}`;
    const allShifts = JSON.parse(localStorage.getItem('allShifts') || '{}');
    allShifts[monthKey] = shifts;
    localStorage.setItem('allShifts', JSON.stringify(allShifts));
    localStorage.setItem('currentMonth', currentMonth);
    localStorage.setItem('currentYear', currentYear);
}

function loadSavedData() {
    const allShifts = JSON.parse(localStorage.getItem('allShifts') || '{}');
    const monthKey = `shifts_${currentYear}_${currentMonth}`;
    shifts = allShifts[monthKey] || {};

    const savedMonth = localStorage.getItem('currentMonth');
    const savedYear = localStorage.getItem('currentYear');
    if (savedMonth && savedYear) {
        currentMonth = parseInt(savedMonth);
        currentYear = parseInt(savedYear);
    }

    const savedRules = localStorage.getItem('employeeRules');
    if (savedRules) {
        const parsedRules = JSON.parse(savedRules);
        Object.keys(employees).forEach(name => {
            if (parsedRules[name]) {
                employees[name] = { ...employees[name], ...parsedRules[name] };
            }
        });
    }

    const savedPrefs = localStorage.getItem('employeePreferences');
    if (savedPrefs) {
        employeePreferences = JSON.parse(savedPrefs);
    }
}

function initializeMonthYearSelects() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (!monthSelect || !yearSelect) return;

    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = new Date(2024, i-1).toLocaleString('cs', { month: 'long' });
        monthSelect.appendChild(option);
    }
    monthSelect.value = currentMonth;

    const currentYearInt = new Date().getFullYear();
    for (let i = currentYearInt - 2; i <= currentYearInt + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

    monthSelect.addEventListener('change', (e) => {
        saveShifts();
        currentMonth = parseInt(e.target.value);
        updateTable();
    });

    yearSelect.addEventListener('change', (e) => {
        saveShifts();
        currentYear = parseInt(e.target.value);
        updateTable();
    });
}

function createShiftTable() {
    const table = document.getElementById('shiftTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    Object.keys(employees).forEach(employee => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = employee;
        tdName.className = 'employee-name';
        tr.appendChild(tdName);
        tbody.appendChild(tr);
    });

    updateTable();
}

function updateTable() {
    const table = document.getElementById('shiftTable');
    if (!table) return;

    const allShifts = JSON.parse(localStorage.getItem('allShifts') || '{}');
    const monthKey = `shifts_${currentYear}_${currentMonth}`;
    shifts = allShifts[monthKey] || {};

    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        th.className = isWeekend(i) ? 'weekend' : '';
        thead.appendChild(th);
    }

    tbody.querySelectorAll('tr').forEach(tr => {
        while (tr.children.length > 1) {
            tr.removeChild(tr.lastChild);
        }

        const employee = tr.firstChild.textContent;
        for (let i = 1; i <= daysInMonth; i++) {
            const td = document.createElement('td');
            td.className = `shift-cell ${isWeekend(i) ? 'weekend' : ''}`;

            const select = document.createElement('select');
            select.className = 'shift-select';
            select.dataset.employee = employee;
            select.dataset.day = i;

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '';
            select.appendChild(emptyOption);

            Object.keys(shiftTypes).forEach(shiftType => {
                const option = document.createElement('option');
                option.value = shiftType;
                option.textContent = shiftType;
                select.appendChild(option);
            });

            const currentShift = shifts[`${employee}-${i}`];
            if (currentShift) {
                select.value = currentShift;
                select.style.backgroundColor = shiftTypes[currentShift].color;
            }

            select.addEventListener('change', (e) => {
                const shift = e.target.value;
                if (shift) {
                    shifts[`${employee}-${i}`] = shift;
                    e.target.style.backgroundColor = shiftTypes[shift].color;
                } else {
                    delete shifts[`${employee}-${i}`];
                    e.target.style.backgroundColor = '';
                }
                saveShifts();
                calculateStats();
            });

            td.appendChild(select);
            tr.appendChild(td);
        }
    });

    calculateStats();
}

function isWeekend(day) {
    const date = new Date(currentYear, currentMonth - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
}

function getFridayHours(shift) {
    if (!shift) return 0;
    if (shift === 'N') return 6;
    if (shift === 'NSK') return 7;
    return 0;
}

function getSundayHours(shift) {
    if (!shift) return 0;
    if (shift === 'N') return 3;
    if (shift === 'NSK') return 5;
    return 0;
}

function getWorkDays() {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    let workDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        if (!isWeekend(day)) {
            workDays++;
        }
    }
    return workDays;
}

function checkRules() {
    const alerts = [];
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    Object.entries(employees).forEach(([name, rules]) => {
        if (rules.isFloor) return;

        let nightCount = 0;
        let roCount = 0;
        let consecutiveShifts = 0;
        let freeWeekends = 0;
        let lastWasNight = false;

        for (let day = 1; day <= daysInMonth; day++) {
            const shift = shifts[`${name}-${day}`];

            if (shift === 'N') nightCount++;
            if (shift === 'RO') roCount++;

            if (shift && shift !== 'V' && shift !== 'D') {
                consecutiveShifts++;
                if (consecutiveShifts > 5) {
                    alerts.push(`${name}: Více než 5 služeb v řadě`);
                    consecutiveShifts = 0;
                }
            } else {
                consecutiveShifts = 0;
            }

            if (lastWasNight && shift && shift !== 'V' && shift !== 'N') {
                alerts.push(`${name}: Služba hned po noční (den ${day})`);
            }
            lastWasNight = (shift === 'N');

            if (isWeekend(day) && day < daysInMonth) {
                if (shifts[`${name}-${day}`] === 'V' && shifts[`${name}-${day+1}`] === 'V') {
                    freeWeekends++;
                }
            }
        }

        if (nightCount > rules.maxNights) {
            alerts.push(`${name}: Překročen limit nočních (${nightCount}/${rules.maxNights})`);
        }
        if (roCount > rules.maxRO) {
            alerts.push(`${name}: Překročen limit RO (${roCount}/${rules.maxRO})`);
        }
        if (!rules.canNights && nightCount > 0) {
            alerts.push(`${name}: Nemůže mít noční služby`);
        }
        if (freeWeekends < rules.minFreeWeekends) {
            alerts.push(`${name}: Nedostatek volných víkendů (${freeWeekends}/${rules.minFreeWeekends})`);
        }

        if (rules.specialRules) {
            const allowedNskDays = [2, 3, 8, 13];
            for (let day = 1; day <= daysInMonth; day++) {
                if (shifts[`${name}-${day}`] === 'NSK' && !allowedNskDays.includes(day)) {
                    alerts.push(`Vaněčková: NSK služba je ve špatný den (${day})`);
                }
            }

            for (let day = 1; day <= daysInMonth; day++) {
                if (new Date(currentYear, currentMonth - 1, day).getDay() === 5) {
                    if (shifts[`${name}-${day}`] !== 'CH') {
                        alerts.push(`Vaněčková: Chybí CH služba v pátek (${day})`);
                    }
                }
            }

            Object.keys(employees).forEach(otherName => {
                if (otherName !== name) {
                    for (let day = 1; day <= daysInMonth; day++) {
                        const shift = shifts[`${otherName}-${day}`];
                        if (shift === 'NSK' || shift === 'CH') {
                            alerts.push(`${otherName}: Nesmí mít ${shift} službu (pouze pro Vaněčkovou)`);
                        }
                    }
                }
            });
        }
    });

    showAlerts(alerts);
    return alerts.length === 0;
}

function checkOccupancy() {
    const alerts = [];
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        let ranniCount = 0;
        let odpoledniCount = 0;
        let roCount = 0;
        let nightCount = 0;

        Object.entries(employees).forEach(([name, rules]) => {
            const shift = shifts[`${name}-${day}`];
            
            if (rules.isFloor && shift === 'N') {
                nightCount++;
            } else {
                if (shift === 'R') ranniCount++;
                if (shift === 'O') odpoledniCount++;
                if (shift === 'RO') roCount++;
                if (shift === 'N') nightCount++;
            }
        });

        if (!((ranniCount === 2 && odpoledniCount === 2 && roCount === 0) ||
              (ranniCount === 1 && odpoledniCount === 1 && roCount === 1))) {
            alerts.push(`Den ${day}: Nesprávné obsazení služeb (R:${ranniCount}, O:${odpoledniCount}, RO:${roCount})`);
        }

        if (nightCount === 0) {
            alerts.push(`Den ${day}: Chybí noční služba`);
        }
    }

    showAlerts(alerts);
    return alerts.length === 0;
}

function calculateStats() {
    const stats = {};
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const workDays = getWorkDays();

    Object.keys(employees).forEach(name => {
        let totalHours = 0;
        let weekendHours = 0;
        const shiftCounts = {};

        Object.keys(shiftTypes).forEach(type => {
            shiftCounts[type] = 0;
        });

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth - 1, day);
            const shift = shifts[`${name}-${day}`];
            
            if (shift && shiftTypes[shift]) {
                shiftCounts[shift]++;
                let hours = shiftTypes[shift].hours;

                if ((shift === 'N' || shift === 'NSK') && isWeekend(day)) {
                    if (date.getDay() === 0) {
                        weekendHours += getSundayHours(shift);
                    } else {
                        weekendHours += hours;
                    }
                } else if (date.getDay() === 6) {
                    const fridayDate = new Date(currentYear, currentMonth - 1, day - 1);
                    const fridayShift = shifts[`${name}-${fridayDate.getDate()}`];
                    if (fridayShift === 'N' || fridayShift === 'NSK') {
                        weekendHours += getFridayHours(fridayShift);
                    }
                    weekendHours += hours;
                } else if (isWeekend(day)) {
                    weekendHours += hours;
                }

                totalHours += hours;
            }
        }

        stats[name] = {
            totalHours,
            weekendHours,
            fundHours: workDays * 7.5,
            overtime: totalHours - (workDays * 7.5),
            shiftCounts
        };
    });

    updateStatsDisplay(stats);
}

function updateStatsDisplay(stats) {
    const statsDiv = document.getElementById('stats');
    if (!statsDiv) return;

    statsDiv.innerHTML = '';
    statsDiv.classList.remove('hidden');

    Object.entries(stats).forEach(([name, stat]) => {
        const employeeStats = document.createElement('div');
        employeeStats.className = 'stats-card';
        employeeStats.innerHTML = `
            
${name}
            
                
                    
Celkem hodin: ${stat.totalHours.toFixed(1)}
                    
Fond pracovní doby: ${stat.fundHours.toFixed(1)}
                    
                        Přesčas: ${stat.overtime.toFixed(1)}
                    
                    
Víkendové hodiny: ${stat.weekendHours.toFixed(1)}
                
                
                    
Počty služeb:
                    ${Object.entries(stat.shiftCounts)
                        .filter(([_, count]) => count > 0)
                        .map(([type, count]) => `
${type}: ${count}
`).join('')}
                
            
        `;
        statsDiv.appendChild(employeeStats);
    });
}

function showAlerts(alerts) {
    const alertsDiv = document.getElementById('alerts');
    const alertsList = document.getElementById('alertsList');
    if (!alertsDiv || !alertsList) return;

    alertsList.innerHTML = '';

    if (alerts.length > 0) {
        alerts.forEach(alert => {
            const li = document.createElement('li');
            li.textContent = alert;
            alertsList.appendChild(li);
        });
        alertsDiv.classList.remove('hidden');
    } else {
        alertsDiv.classList.add('hidden');
        alert('Všechna pravidla jsou splněna.');
    }
}

function createLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;

    Object.entries(shiftTypes).forEach(([code, {name, color, hours}]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        div.innerHTML = `
            

            ${code} - ${name} (${hours}h)
        `;
        legend.appendChild(div);
    });
}

function exportToWord() {
    // Hlavička dokumentu s UTF-8 a základním stylem pro tisk
    const header = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Rozpis služeb</title>
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                td, th { border: 1px solid black; padding: 5px; text-align: center; font-size: 12px; }
                .shift-N { background-color: rgb(211,211,211); }
                .shift-D { background-color: rgb(144,238,144); }
                .shift-NSK { background-color: rgb(173,216,230); }
                th { background-color: #f3f4f6; }
            </style>
        </head>
        <body>
    `;

    // Název měsíce a roku
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('cs', { month: 'long' });
    let content = `
        <h1>Rozpis služeb - ${monthName} ${currentYear}</h1>
        <table>
            <tr>
                <th>Jméno</th>
    `;

    // Přidání dnů měsíce do hlavičky tabulky
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        content += `<th>${i}</th>`;
    }
    content += '</tr>';

    // Přidání řádků pro jednotlivé zaměstnance
    Object.keys(employees).forEach(employee => {
        const [lastName, firstName] = employee.split(' ');
        content += `
            <tr>
                <td>${firstName} ${lastName}</td>
        `;
        
        // Přidání směn pro každý den
        for (let day = 1; day <= daysInMonth; day++) {
            const shift = shifts[`${employee}-${day}`] || '';
            let shiftClass = '';
            
            if (shift === 'N') shiftClass = 'shift-N';
            else if (shift === 'D') shiftClass = 'shift-D';
            else if (shift === 'NSK') shiftClass = 'shift-NSK';
            
            content += `<td class="${shiftClass}">${shift}</td>`;
        }
        content += '</tr>';
    });

    // Ukončení tabulky
    content += '</table>';

    // Patička dokumentu
    const footer = `
        </body>
        </html>
    `;

    // Vytvoření a stažení souboru
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rozpis_sluzeb_${monthName}_${currentYear}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function generateEmployeeCards() {
    const container = document.querySelector('.grid');
    if (!container) return;

    Object.entries(employees).forEach(([name, rules]) => {
        if (rules.isFloor) return;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-4';
        card.innerHTML = `
            
${name}
            
                
                    Maximum nočních služeb
                    
                
                
                    Maximum RO služeb
                    
                
                
                    Minimální počet volných víkendů
                    
                
                
                    
                    Může mít noční služby
                
                ${rules.specialRules ? `
                
                    
                    Speciální pravidla
                
                ` : ''}
            
        `;
        container.appendChild(card);
    });
}

function saveAllRules() {
    const updatedRules = {};
    
    document.querySelectorAll('input[data-employee]').forEach(input => {
        const name = input.dataset.employee;
        const rule = input.dataset.rule;
        const value = input.type === 'checkbox' ? input.checked : Number(input.value);
        
        if (!updatedRules[name]) {
            updatedRules[name] = {};
        }
        updatedRules[name][rule] = value;
    });

    localStorage.setItem('employeeRules', JSON.stringify(updatedRules));
    
    const generalRules = {
        minDayStaff: Number(document.getElementById('minDayStaff').value),
        minNightStaff: Number(document.getElementById('minNightStaff').value),
        maxConsecutiveShifts: Number(document.getElementById('maxConsecutiveShifts').value)
    };
    localStorage.setItem('generalRules', JSON.stringify(generalRules));

    alert('Pravidla byla úspěšně uložena');
}

function clearCurrentMonthShifts() {
    if (confirm(`Opravdu chcete vymazat všechny služby pro ${new Date(currentYear, currentMonth - 1).toLocaleString('cs', { month: 'long' })} ${currentYear}?`)) {
        const allShifts = JSON.parse(localStorage.getItem('allShifts') || '{}');
        const monthKey = `shifts_${currentYear}_${currentMonth}`;
        delete allShifts[monthKey];
        localStorage.setItem('allShifts', JSON.stringify(allShifts));
        
        shifts = {};
        
        updateTable();
        alert('Služby byly vymazány.');
    }
}

function generatePreferenceForm() {
    const form = document.getElementById('preferencesForm');
    if (!form) return;

    form.innerHTML = '';
    Object.keys(employees).filter(name => !employees[name].isFloor).forEach(name => {
        const prefs = employeePreferences[name] || { hours: 150, preferredShifts: ['R', 'O'], unavailableDays: [] };
        const div = document.createElement('div');
        div.className = 'border p-4 rounded-lg';
        div.innerHTML = `
            
${name}
            
                
                    Počet požadovaných hodin:
                    
                
                
                    Preferované směny (oddělené čárkou, např. R,O,N):
                    ${prefs.preferredShifts.join(',')}
                
                
                    Nedostupné dny (oddělené čárkou, např. 1,15):
                    ${prefs.unavailableDays.join(',')}
                
            
        `;
        form.appendChild(div);
    });
}

function savePreferences() {
    employeePreferences = {};
    document.querySelectorAll('#preferencesForm input[data-employee]').forEach(input => {
        const name = input.dataset.employee;
        const type = input.dataset.type;
        let value = input.value;

        if (type === 'hours') value = parseInt(value) || 0;
        else if (type === 'preferredShifts') value = value.split(',').map(s => s.trim()).filter(s => s);
        else if (type === 'unavailableDays') value = value.split(',').map(d => parseInt(d.trim())).filter(d => d);

        if (!employeePreferences[name]) employeePreferences[name] = {};
        employeePreferences[name][type] = value;
    });
    localStorage.setItem('employeePreferences', JSON.stringify(employeePreferences));
    alert('Požadavky byly uloženy. Nyní můžete generovat služby.');
}

function generateShifts() {
    console.log("Generování služeb spuštěno...");
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const floorEmployee = "Růžek Přízemí";
    const maxAttempts = 5; // Snížíme počet pokusů
    shifts = {};

    const employeesList = Object.keys(employees).filter(name => !employees[name].isFloor);
    console.log("Zaměstnanci k dispozici:", employeesList);

    function checkFreeWeekends() {
        const weekendDays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            if (isWeekend(day)) weekendDays.push(day);
        }
        const freeWeekendsPerEmployee = {};
        employeesList.forEach(name => {
            freeWeekendsPerEmployee[name] = 0;
            weekendDays.forEach(day => {
                const shift = shifts[`${name}-${day}`];
                if (shift === undefined || shift === 'V' || shift === 'D') freeWeekendsPerEmployee[name]++;
            });
        });
        return Object.entries(freeWeekendsPerEmployee).every(([name, count]) => count >= employees[name].minFreeWeekends);
    }

    function generateDay(day) {
        console.log(`Generuji den ${day}`);
        const dayShifts = {};
        const availableEmployees = employeesList.filter(name => {
            const rules = employees[name];
            const prefs = employeePreferences[name] || {};
            const currentShifts = Object.keys(shifts).filter(s => s.startsWith(`${name}-`)).length;
            const unavailable = prefs.unavailableDays || [];
            return !unavailable.includes(day) && currentShifts < 22;
        });
        console.log(`Dostupní zaměstnanci pro den ${day}:`, availableEmployees);

        // Zkusíme základní přiřazení
        if (availableEmployees.length >= 3) {
            dayShifts[`${availableEmployees[0]}-${day}`] = 'R';
            dayShifts[`${availableEmployees[1]}-${day}`] = 'O';
            const nightEligible = availableEmployees.filter(name => employees[name].canNights);
            if (nightEligible.length > 0) {
                dayShifts[`${nightEligible[0]}-${day}`] = 'N';
            } else {
                console.warn(`Den ${day}: Žádný zaměstnanec na noční službu`);
            }
        } else {
            console.warn(`Den ${day}: Nedostatek zaměstnanců (${availableEmployees.length})`);
        }

        Object.assign(shifts, dayShifts);

        // Kontrola - pokud nesplňuje, pokračujeme dál
        if (!checkRules() || !checkOccupancy()) {
            console.warn(`Den ${day}: Nesplňuje pravidla nebo obsazení`);
        }
    }

    for (let day = 1; day <= daysInMonth; day++) {
        generateDay(day);
    }

    updateTable();
    saveShifts();
    console.log("Generování dokončeno, shifts:", shifts);
    alert('Služby vygenerovány. Některé dny mohou být neúplné.');
}
