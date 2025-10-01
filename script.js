// Main JavaScript file for Madam Boutique

// Sample product data
const products = [
    {
        id: 1,
        name: "Elegant Lawn Suit",
        brand: "gul-ahmed",
        price: 4500,
        rating: 4.5,
        reviews: 23,
        image: "product1.jpg",
        category: "suits"
    },
    {
        id: 2,
        name: "Embroidered Chiffon",
        brand: "khaddi",
        price: 6800,
        rating: 4.8,
        reviews: 15,
        image: "product2.jpg",
        category: "formal"
    },
    {
        id: 3,
        name: "Cotton Casual Wear",
        brand: "almirah",
        price: 3200,
        rating: 4.2,
        reviews: 31,
        image: "product3.jpg",
        category: "casual"
    },
    {
        id: 4,
        name: "Silk Formal Dress",
        brand: "gul-ahmed",
        price: 8900,
        rating: 4.9,
        reviews: 8,
        image: "product4.jpg",
        category: "formal"
    },
    {
        id: 5,
        name: "Traditional Kurta",
        brand: "khaddi",
        price: 2800,
        rating: 4.3,
        reviews: 42,
        image: "product5.jpg",
        category: "traditional"
    },
    {
        id: 6,
        name: "Designer Palazzo Set",
        brand: "almirah",
        price: 5500,
        rating: 4.6,
        reviews: 19,
        image: "product6.jpg",
        category: "sets"
    }
    
];

// Cart functionality
let cart = JSON.parse(localStorage.getItem('madamBoutiqueCart')) || [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    updateCartCount();
    loadFeaturedProducts();
    setupNewsletterForm();
    setupAnimations();
    setupReviewSystem();
}

// Navigation functionality
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }

    // Set active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Cart functions
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    localStorage.setItem('madamBoutiqueCart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('madamBoutiqueCart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            localStorage.setItem('madamBoutiqueCart', JSON.stringify(cart));
            updateCartCount();
        }
    }
}

// Product display functions
function createProductCard(product) {
    const stars = createStarRating(product.rating);
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" />
            </div>
            <div class="product-info">
                <div class="product-brand">${getBrandName(product.brand)}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <div class="user-review" data-product-id="${product.id}">
                    <span class="rate-text">Rate this product:</span>
                    <div class="star-input">
                        ${[1,2,3,4,5].map(i => `<i class="far fa-star rate-star" data-value="${i}"></i>`).join('')}
                    </div>
                </div>
                <div class="product-price">Rs. ${product.price.toLocaleString()}</div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function createStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star star empty"></i>';
    }
    
    return stars;
}

function getBrandName(brandKey) {
    const brandNames = {
        'gul-ahmed': 'Gul Ahmed',
        'khaddi': 'Khaddi',
        'almirah': 'Almirah'
    };
    return brandNames[brandKey] || brandKey;
}

function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (container) {
        const featuredProducts = products.slice(0, 3);
        container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
        setupReviewSystem(); // re-attach review events
    }
}

// Review system
function setupReviewSystem() {
    document.querySelectorAll('.rate-star').forEach(star => {
        star.addEventListener('click', function() {
            const productId = parseInt(this.closest('.user-review').dataset.productId);
            const ratingValue = parseInt(this.dataset.value);

            // highlight stars up to clicked one
            const stars = this.parentElement.querySelectorAll('.rate-star');
            stars.forEach(s => s.classList.remove('selected'));
            stars.forEach(s => {
                if (parseInt(s.dataset.value) <= ratingValue) {
                    s.classList.add('selected');
                }
            });

            // Update product data
            const product = products.find(p => p.id === productId);
            if (product) {
                product.reviews += 1;
                product.rating = ((product.rating * (product.reviews - 1)) + ratingValue) / product.reviews;
            }

            localStorage.setItem('madamBoutiqueProducts', JSON.stringify(products));
            showNotification(`You rated ${ratingValue} stars for ${product.name}`);
        });
    });
}

// Newsletter form
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            showNotification('Thank you for subscribing!');
            this.reset();
        });
    }
}

// Animations and interactions
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.brand-card, .product-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('add-to-cart') && !e.target.classList.contains('rate-star')) {
                const productId = this.dataset.productId;
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
    });
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-pink);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .star-input {
        display: flex;
        gap: 5px;
        cursor: pointer;
    }

    .rate-star {
        font-size: 20px;
        color: #ccc;
        transition: color 0.2s;
    }

    .rate-star:hover,
    .rate-star.selected {
        color: #ffcc00;
    }
`;
document.head.appendChild(style);

// Export functions for use in other pages
window.MadamBoutique = {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartCount,
    createProductCard,
    createStarRating,
    getBrandName,
    showNotification
};
