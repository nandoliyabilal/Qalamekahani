const CartUtils = {
    KEY: 'qalamekahani_cart',

    getCart() {
        return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    },

    addToCart(id) {
        let cart = this.getCart();
        if (!cart.includes(id)) {
            cart.push(id);
            localStorage.setItem(this.KEY, JSON.stringify(cart));
            return true;
        }
        return false;
    },

    removeFromCart(id) {
        let cart = this.getCart();
        cart = cart.filter(itemId => itemId !== id);
        localStorage.setItem(this.KEY, JSON.stringify(cart));
    },

    isInCart(id) {
        const cart = this.getCart();
        return cart.includes(id);
    },

    count() {
        return this.getCart().length;
    }
};
