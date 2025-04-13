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
    gsap.to('.cta-button, .product-card, .section-title, .about-text', {
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

// Featured Products Carousel
async function generateFeaturedProducts() {
    const products = await loadProducts();
    const featuredContainer = document.getElementById('featured-products');
    // Выбираем первые 6 товаров для карусели
    const featuredProducts = products.slice(0, 6);
    
    featuredProducts.forEach(product => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide product-card';
        slide.dataset.id = product.id;
        slide.innerHTML = `
            <img src="${product.images[0] || 'https://via.placeholder.com/600x400?text=' + product.name}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="btn-group">
                <button class="add-to-cart-btn" data-product-id="${product.id}">+ В корзину!</button>
                <a href="shop.html" class="details-btn">Подробно</a>
            </div>
        `;
        featuredContainer.appendChild(slide);
    });

    // Инициализация Swiper
    new Swiper('.featured-swiper', {
        slidesPerView: 1,
        spaceBetween: 15,
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-prev',
            prevEl: '.swiper-button-next',
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            }
        }
    });

    // Добавляем обработчики для кнопок корзины
    addCartButtonListeners(products);
}

// Вызываем генерацию карусели
generateFeaturedProducts();

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
        button.textContent = '+ В корзину!';
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

async function addCartButtonListeners(products) {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
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
}

// Инициализация корзины
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
    });
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

// GSAP Animations
gsap.from('.hero-content', {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power2.out',
    delay: 0.5
});

gsap.from('.about', {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '.about',
        start: 'top 80%'
    }
});

gsap.from('.featured-products .product-card', {
    opacity: 0,
    y: 20,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.1,
    scrollTrigger: {
        trigger: '.featured-products',
        start: 'top 80%'
    }
});

// Убираем анимацию прозрачности для дочерних элементов карточек
document.querySelectorAll('.product-card h3, .product-card p, .product-card .btn-group').forEach(el => {
    el.style.opacity = '1';
    el.style.display = 'block';
    el.style.visibility = 'visible';
});
