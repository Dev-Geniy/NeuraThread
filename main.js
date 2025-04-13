// Асинхронная загрузка товаров из JSON
async function loadProducts() {
    try {
        const response = await fetch('products/products.json');
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// WebGL Background
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-bg'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BufferGeometry();
const vertices = [];
for (let i = 0; i < 500; i++) {
    vertices.push(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
    );
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const material = new THREE.PointsMaterial({ color: 0xA100FF, size: 0.4 });
const points = new THREE.Points(geometry, material);
scene.add(points);
camera.position.z = 100;

function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const themes = ['purple-theme', 'green-theme', 'red-theme'];
const colors = [0xA100FF, 0x00FF99, 0xFF3D3D];
let currentThemeIndex = 0;

themeToggle.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    document.body.className = themes[currentThemeIndex];
    material.color.setHex(colors[currentThemeIndex]);
    gsap.to('.product-card', {
        boxShadow: `0 0 25px ${['#A100FF', '#00FF99', '#FF3D3D'][currentThemeIndex]}`,
        duration: 0.5,
        ease: 'power2.out'
    });
});

// Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    gsap.to(mobileMenu, {
        right: mobileMenu.classList.contains('active') ? 0 : '-100%',
        duration: 0.4,
        ease: 'power2.inOut'
    });
});

// Filter Toggle
const filterToggle = document.querySelector('.filter-toggle');
const filterSidebar = document.querySelector('.filter-sidebar');
filterToggle.addEventListener('click', () => {
    filterSidebar.classList.toggle('active');
    gsap.to(filterSidebar, {
        left: filterSidebar.classList.contains('active') ? 0 : '-100%',
        duration: 0.4,
        ease: 'power2.inOut'
    });
});

// Генерация карточек товаров
const productGrid = document.getElementById('product-grid');

async function generateProductCards() {
    const products = await loadProducts();
    productGrid.innerHTML = ''; // Очищаем контейнер
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = product.category;
        card.dataset.price = parseInt(product.price.replace('$', ''));
        card.dataset.id = product.id;
        card.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="btn-group">
                <button class="add-to-cart-btn" data-product-id="${product.id}">+ В корзину!</button>
                <button class="details-btn" data-product-id="${product.id}">Подробно</button>
            </div>
        `;
        productGrid.appendChild(card);
    });

    // Добавляем обработчики событий для новых кнопок
    addEventListenersToButtons(products);
}

// Вызываем генерацию карточек при загрузке страницы
generateProductCards();

// Функция для добавления обработчиков событий
function addEventListenersToButtons(products) {
    // Обработчики для кнопок "Добавить в корзину"
    document.querySelectorAll('.add-to-cart-btn:not(.modal-cart-btn)').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const inCart = cart.find(item => item.id === productId);
            if (inCart) {
                removeFromCart(productId);
            } else {
                addToCart(product);
            }

            gsap.to(button, {
                scale: 1.1,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            });
        });
    });

    // Обработчики для кнопок "Подробнее"
    document.querySelectorAll('.details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            const product = products.find(p => p.id === productId);
            if (product) {
                openProductModal(product);
            }
        });
    });
}

// Cart Logic
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartCount = document.getElementById('cart-count');

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartButtonState(button, productId) {
    const inCart = cart.find(item => item.id === productId);
    if (inCart) {
        button.classList.add('in-cart');
        button.textContent = 'В корзине!';
    } else {
        button.classList.remove('in-cart');
        button.textContent = 'Добавить в корзину!';
    }
}

function updateAllCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        const productId = button.dataset.productId;
        updateCartButtonState(button, productId);
    });
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    updateCartCount();
    updateAllCartButtons();
}

function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity -= 1;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    updateCartCount();
    updateAllCartButtons();
}

// Инициализация состояния кнопок при загрузке
updateCartCount();
updateAllCartButtons();

// Cart Modal Logic
const cartModal = document.querySelector('.cart-modal');
const cartInfo = document.querySelector('.cart-info');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.querySelector('.checkout-btn');

async function openCartModal() {
    const products = await loadProducts();
    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;

        const price = parseFloat(product.price.replace('$', '')) * item.quantity;
        totalPrice += price;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${item.name}</span>
            <span>Цена: ${item.price} x ${item.quantity}</span>
            <button class="remove-from-cart" data-id="${item.id}">Не брать...</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalPrice.textContent = `${totalPrice.toFixed(2)}$`;

    cartModal.classList.add('active');
    cartModal.style.display = 'block';
    gsap.fromTo('.cart-modal .modal-content', 
        { opacity: 0, y: 100, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
}

function closeCartModal() {
    gsap.to('.cart-modal .modal-content', {
        opacity: 0,
        y: 100,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            cartModal.classList.remove('active');
            cartModal.style.display = 'none';
            gsap.set('.cart-modal .modal-content', { clearProps: 'all' });
        }
    });
}

cartInfo.addEventListener('click', () => {
    openCartModal();
});

cartModal.querySelector('.modal-close').addEventListener('click', () => {
    closeCartModal();
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        closeCartModal();
    }
});

cartModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-from-cart')) {
        const productId = e.target.dataset.id;
        removeFromCart(productId);
        openCartModal();
    }
});

// Отправка заказа в Telegram-бота
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Ваша корзина пуста!');
        return;
    }

    const products = await loadProducts();
    let message = 'Заказ:\n';
    let totalPrice = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;

        const price = parseFloat(product.price.replace('$', '')) * item.quantity;
        totalPrice += price;
        message += `Товар: ${item.name}, Цена: ${item.price}, Количество: ${item.quantity}\n`;
    });

    message += `Итого: ${totalPrice.toFixed(2)}$`;

    const botToken = 'YOUR_BOT_TOKEN';
    const chatId = 'YOUR_CHAT_ID';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            alert('Заказ успешно отправлен!');
            cart = [];
            updateCartCount();
            updateAllCartButtons();
            closeCartModal();
        } else {
            alert('Ошибка при отправке заказа. Попробуйте снова.');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка. Проверьте подключение к интернету.');
    });
});

// Filter Logic
const filterButtons = document.querySelectorAll('.filter-btn');

async function applyFilters(isInitialLoad = false) {
    const products = await loadProducts();
    const activeFilterButton = document.querySelector('.filter-btn.active');
    const category = activeFilterButton.dataset.section || 'all';
    const priceRange = activeFilterButton.dataset.price;

    const productCards = document.querySelectorAll('.product-card');

    if (isInitialLoad) {
        // При начальной загрузке просто применяем фильтр без анимации
        productCards.forEach(product => {
            const productPrice = parseInt(product.dataset.price);
            let showByCategory = category === 'all' || product.dataset.category === category;
            let showByPrice = true;

            if (priceRange) {
                if (priceRange === '0-100') showByPrice = productPrice <= 100;
                else if (priceRange === '100-200') showByPrice = productPrice > 100 && productPrice <= 200;
                else if (priceRange === '200+') showByPrice = productPrice > 200;
            }

            product.style.display = (showByCategory && showByPrice) ? 'block' : 'none';
            product.style.opacity = '1'; // Устанавливаем полную видимость
            product.style.transform = 'scale(1)'; // Устанавливаем нормальный масштаб
        });
    } else {
        // Для последующих фильтров используем анимацию
        gsap.to(productCards, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                productCards.forEach(product => {
                    const productPrice = parseInt(product.dataset.price);
                    let showByCategory = category === 'all' || product.dataset.category === category;
                    let showByPrice = true;

                    if (priceRange) {
                        if (priceRange === '0-100') showByPrice = productPrice <= 100;
                        else if (priceRange === '100-200') showByPrice = productPrice > 100 && productPrice <= 200;
                        else if (priceRange === '200+') showByPrice = productPrice > 200;
                    }

                    product.style.display = (showByCategory && showByPrice) ? 'block' : 'none';
                });

                gsap.to(productCards, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
    }
}

// Вызываем applyFilters при загрузке страницы без анимации
document.addEventListener('DOMContentLoaded', () => {
    applyFilters(true); // true указывает на начальную загрузку
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilters(); // Обычная фильтрация с анимацией

        if (filterSidebar.classList.contains('active')) {
            filterSidebar.classList.remove('active');
            gsap.to(filterSidebar, { left: '-100%', duration: 0.4, ease: 'power2.inOut' });
        }
    });
});

// Product Modal Logic
const productModal = document.querySelector('.product-modal');
const modalClose = document.querySelector('.product-modal .modal-close');
const modalTitle = document.querySelector('.modal-title');
const modalDescription = document.querySelector('.modal-description');
const modalPrice = document.querySelector('.modal-price');
const modalCartBtn = document.querySelector('.modal-cart-btn');
const swiperWrapper = document.querySelector('.swiper-wrapper');

let swiper;
let currentProduct = null;

async function openProductModal(product) {
    const products = await loadProducts();
    currentProduct = product;

    modalTitle.textContent = product.name || 'Unknown Product';
    modalDescription.textContent = product.description || 'No description available';
    modalPrice.textContent = product.price || 'Price not specified';

    modalCartBtn.dataset.productId = product.id;

    swiperWrapper.innerHTML = '';
    if (product.images && product.images.length > 0) {
        product.images.forEach(image => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `<img src="${image}" alt="${product.name}">`;
            swiperWrapper.appendChild(slide);
        });
    } else {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<img src="https://via.placeholder.com/600x400?text=No+Image" alt="No Image">`;
        swiperWrapper.appendChild(slide);
    }

    productModal.classList.add('active');
    productModal.style.display = 'block';

    setTimeout(() => {
        if (swiper) swiper.destroy(true, true);
        swiper = new Swiper('.swiper', {
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }, 100);

    updateCartButtonState(modalCartBtn, product.id);

    gsap.fromTo('.product-modal .modal-content', 
        { opacity: 0, y: 100, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
    gsap.from('.swiper-slide img', {
        opacity: 0,
        scale: 0.8,
        duration: 0.7,
        delay: 0.2,
        ease: 'power2.out'
    });
    gsap.from('.modal-details-content > *', {
        opacity: 0,
        y: 50,
        stagger: 0.1,
        duration: 0.5,
        delay: 0.3,
        ease: 'power2.out'
    });
}

function closeProductModal() {
    gsap.to('.product-modal .modal-content', {
        opacity: 0,
        y: 100,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            productModal.classList.remove('active');
            productModal.style.display = 'none';
            gsap.set('.product-modal .modal-content', { clearProps: 'all' });
            gsap.set('.swiper-slide img', { clearProps: 'all' });
            gsap.set('.modal-details-content > *', { clearProps: 'all' });
            if (swiper) swiper.destroy(true, true);
            currentProduct = null;
        }
    });
}

modalClose.addEventListener('click', () => {
    closeProductModal();
});

modalCartBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const products = await loadProducts();
    const productId = modalCartBtn.dataset.productId;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const inCart = cart.find(item => item.id === productId);
    if (inCart) {
        removeFromCart(productId);
    } else {
        addToCart(product);
    }

    updateCartButtonState(modalCartBtn, productId);

    gsap.to(modalCartBtn, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
    });
});

modalCartBtn.addEventListener('touchstart', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const products = await loadProducts();
    const productId = modalCartBtn.dataset.productId;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const inCart = cart.find(item => item.id === productId);
    if (inCart) {
        removeFromCart(productId);
    } else {
        addToCart(product);
    }

    updateCartButtonState(modalCartBtn, productId);

    gsap.to(modalCartBtn, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
    });
});

// GSAP Animations for Product Cards
gsap.from('.product-card', {
    y: 20,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.1
});

// Убрали анимацию дочерних элементов, чтобы избежать прозрачности
document.querySelectorAll('.product-card h3, .product-card p, .product-card .btn-group').forEach(el => {
    el.style.opacity = '1';
    el.style.display = 'block';
    el.style.visibility = 'visible';
});
