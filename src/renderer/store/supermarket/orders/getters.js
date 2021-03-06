export default {
    products: state => {
        return state.products
    },

    productsAdded: (state, getters) => {
        return [...getters.products[state.selectedOrderNumber]].reverse()
    },

    productInCount: (state, getters) => id => {
        let product = getters.products[state.selectedOrderNumber].find(x => x.id == id)
        if (product)
            return product.inCount
        else
            return 0
    },

    ordersList: state => {
        return state.ordersList
    },

    orderList: (state, getters) => {
        return getters.ordersList[state.selectedOrderNumber]
    },

    totalPrice: (state, getters) => {
        let total = 0
        getters.productsAdded.forEach(x => total += x.price * x.inCount)
        return total
    },

    lastOrder: state => {
        return state.lastOrder
    },

    calculator: state => {
        return state.calculator
    },

    selectedCategory: state => {
        return state.selectedCategory
    },

    orders: state => {
        return [...state.orders].reverse()
    },

    ordersOfCustomer: (state, getters) => id => {
        return getters.orders.filter(x => x.customer_id == id)
    },

    // Analytics
    sales: (state, getters) => {
        let sales = 0

        getters.orders.forEach(function (order) {
            sales += order.products.reduce(function (res, product) {
                return res + (product.pivot.count * product.pivot.price);
            }, 0);
        });

        return sales
    },

    settings: (state) => {
        return state.settings
    }




}