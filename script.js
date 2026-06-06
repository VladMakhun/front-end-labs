// --- Константи та DOM елементи ---
const API_URL = 'https://dummyjson.com/users';

const btnGetUsers = document.getElementById('btn-get-users');
const btnSearch = document.getElementById('btn-search');
const searchInput = document.getElementById('search-input');
const formCreateUser = document.getElementById('create-user-form');
const usersContainer = document.getElementById('users-container');
const loader = document.getElementById('loader');
const notification = document.getElementById('notification');

// --- Слухачі подій ---
btnGetUsers.addEventListener('click', () => fetchUsers());
btnSearch.addEventListener('click', () => searchUsers());
formCreateUser.addEventListener('submit', (e) => createUser(e));

// --- Допоміжні функції (UI) ---
function toggleLoader(show) {
    if (show) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
}

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = isError ? 'notify-error' : 'notify-success';
    notification.classList.remove('hidden');
    
    // Ховаємо повідомлення через 3 секунди
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// ==========================================
// 1. GET: Отримання списку (Read)
// ==========================================
async function fetchUsers() {
    usersContainer.innerHTML = ''; // Очищаємо список
    toggleLoader(true);

    try {
        const response = await fetch(`${API_URL}?limit=10`);
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        renderUsersList(data.users); // dummyjson повертає масив у властивості 'users'
    } catch (error) {
        showNotification(error.message, true);
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// 2. GET: Пошук (Search)
// ==========================================
async function searchUsers() {
    const query = searchInput.value.trim();
    if (!query) {
        showNotification('Please enter a search term', true);
        return;
    }

    usersContainer.innerHTML = '';
    toggleLoader(true);

    try {
        // Використовуємо encodeURIComponent для безпечної передачі запиту
        const url = `${API_URL}/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        
        if (data.users.length === 0) {
            usersContainer.textContent = 'No users found.';
        } else {
            renderUsersList(data.users);
        }
    } catch (error) {
        showNotification(error.message, true);
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// 3. POST: Створення (Create)
// ==========================================
async function createUser(event) {
    event.preventDefault(); // Зупиняємо перезавантаження сторінки
    toggleLoader(true);

    const newUser = {
        firstName: document.getElementById('add-firstname').value,
        lastName: document.getElementById('add-lastname').value,
        age: document.getElementById('add-age').value,
        email: document.getElementById('add-email').value,
    };

    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (!response.ok) throw new Error('Failed to create user');
        
        const createdUser = await response.json();
        showNotification('User created successfully.');
        
        // Відображаємо нового користувача на початку списку
        const card = createUserElement(createdUser);
        usersContainer.prepend(card);
        
        formCreateUser.reset(); // Очищаємо форму
    } catch (error) {
        showNotification(error.message, true);
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// 4. PATCH: Оновлення (Update)
// ==========================================
async function editUser(userId, cardElement) {
    // Для простоти використаємо prompt для запиту нового прізвища
    const newLastName = prompt("Enter new last name for this user:");
    if (!newLastName) return; // Якщо користувач натиснув "Скасувати" або ввів порожній рядок

    toggleLoader(true);
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lastName: newLastName })
        });

        if (!response.ok) throw new Error('Failed to update user');
        
        const updatedUser = await response.json();
        showNotification('User updated successfully.');

        // Оновлюємо DOM (змінюємо текст у відповідному елементі картки)
        const nameHeading = cardElement.querySelector('h3');
        nameHeading.textContent = `${updatedUser.firstName} ${updatedUser.lastName}`;

    } catch (error) {
        showNotification(error.message, true);
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// 5. DELETE: Видалення (Delete)
// ==========================================
async function deleteUser(userId, cardElement) {
    const isConfirmed = confirm("Delete this user?");
    if (!isConfirmed) return;

    toggleLoader(true);
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete user');
        
        showNotification('User deleted successfully.');
        
        // Видаляємо картку з DOM
        cardElement.remove();
        
    } catch (error) {
        showNotification(error.message, true);
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// Функції рендерингу (Робота з DOM)
// ==========================================

function renderUsersList(users) {
    users.forEach(user => {
        const card = createUserElement(user);
        usersContainer.append(card);
    });
}

// Створення єдиної картки суворо через createElement
function createUserElement(user) {
    const card = document.createElement('div');
    card.className = 'user-card';

    // Заголовок (Ім'я та Прізвище)
    const nameEl = document.createElement('h3');
    nameEl.textContent = `${user.firstName} ${user.lastName}`;
    card.append(nameEl);

    // Допоміжна функція для рядків даних
    const addField = (label, value) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        p.append(strong);
        p.append(value || 'N/A'); // Якщо даних немає (наприклад при POST), пишемо N/A
        card.append(p);
    };

    addField('Email', user.email);
    addField('Age', user.age);
    addField('Phone', user.phone);

    // Блок для кнопок
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    // Кнопка Edit (PATCH)
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-warning';
    btnEdit.textContent = 'Edit';
    btnEdit.addEventListener('click', () => editUser(user.id, card));

    // Кнопка Delete (DELETE)
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-danger';
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', () => deleteUser(user.id, card));

    actionsDiv.append(btnEdit, btnDelete);
    card.append(actionsDiv);

    return card;
}