// WebGL Background
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-bg'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BufferGeometry();
const vertices = [];
for (let i = 0; i < 1000; i++) {
    vertices.push(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
    );
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const material = new THREE.PointsMaterial({ color: 0xA100FF, size: 0.5 });
const points = new THREE.Points(geometry, material);
scene.add(points);
camera.position.z = 100;

function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.002;
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
    gsap.to('.product-card, .blog-card, .charity-item', {
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

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('products/products.json');
        if (!response.ok) throw new Error(`Failed to load products: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Featured Products
async function generateFeaturedProducts() {
    const products = await loadProducts();
    const featuredContainer = document.getElementById('featured-products');

    if (!products.length) {
        console.warn('No products available to display.');
        featuredContainer.innerHTML = '<p>Товары временно недоступны.</p>';
        return;
    }

    // Функция для случайного выбора n элементов из массива
    function getRandomItems(array, numItems) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numItems);
    }

    // Выбираем до 6 случайных товаров
    const randomProducts = getRandomItems(products, Math.min(6, products.length));
    
    featuredContainer.innerHTML = '';
    randomProducts.forEach(product => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="product-card">
                <img src="${product.images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.price}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Добавить в корзину</button>
                <button class="details-btn" data-product-id="${product.id}">Подробно</button>
            </div>
        `;
        featuredContainer.appendChild(slide);
    });

    // Инициализация Swiper
    const swiper = new Swiper('.featured-swiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: randomProducts.length > 1, // Включаем loop только если товаров больше 1
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
        }
    });

    addEventListenersToButtons(randomProducts);
}

// Load Blog Posts
async function loadBlogPosts() {
    try {
        const response = await fetch('blog/posts.json');
        if (!response.ok) throw new Error('Failed to load blog posts');
        return await response.json();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        return [];
    }
}

async function generateBlogPosts() {
    const posts = await loadBlogPosts();
    const blogContainer = document.getElementById('blog-posts');
    const recentPosts = posts.slice(0, 3);
    blogContainer.innerHTML = '';
    recentPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.innerHTML = `
            <img src="${post.image}" alt="${post.title}">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
        `;
        blogContainer.appendChild(card);
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
            <button class="remove-from-cart" data-id="${item.id}">Убрать</button>
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
        }
    });
}

cartInfo.addEventListener('click', openCartModal);
cartModal.querySelector('.modal-close').addEventListener('click', closeCartModal);
cartModal.addEventListener('click', e => {
    if (e.target === cartModal) closeCartModal();
    if (e.target.classList.contains('remove-from-cart')) {
        const productId = e.target.dataset.id;
        removeFromCart(productId);
        openCartModal();
    }
});

// Checkout
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    const products = await loadCartProducts();
    let message = 'Заказ:\n';
    let totalPrice = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        const price = parseFloat(product.price.replace('$', '')) * item.quantity;
        totalPrice += price;
        message += `Товар: ${item.name}, Цена: ${item.price}, Кол-во: ${item.quantity}\n`;
    });

    message += `Итого: ${totalPrice.toFixed(2)}$`;

    const botToken = 'YOUR_BOT_TOKEN';
    const chatId = 'YOUR_CHAT_ID';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            alert('Заказ отправлен!');
            cart = [];
            updateCartCount();
            updateAllCartButtons();
            closeCartModal();
        } else {
            alert('Ошибка отправки заказа.');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка сети.');
    });
});

// Event Listeners for Product Buttons
function addEventListenersToButtons(products) {
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

    document.querySelectorAll('.details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.productId;
            window.location.href = `shop.html#product-${productId}`;
        });
    });
}

// Initialize
generateFeaturedProducts();
generateBlogPosts();
updateCartCount();
updateAllCartButtons();

// GSAP Animations
gsap.registerPlugin(ScrollTrigger); // Регистрируем ScrollTrigger

gsap.from('.hero-content', {
    opacity: 0,
    y: 100,
    duration: 1,
    ease: 'power2.out'
});

gsap.from('.about-content > *', {
    opacity: 0,
    y: 50,
    stagger: 0.2,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.about', start: 'top 80%' }
});

gsap.from('.charity-item', {
    opacity: 0,
    scale: 0.9,
    stagger: 0.2,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.charity', start: 'top 80%' }
});

gsap.from('.blog-card', {
    opacity: 0,
    y: 50,
    stagger: 0.2,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.blog-teaser', start: 'top 80%' }
});
