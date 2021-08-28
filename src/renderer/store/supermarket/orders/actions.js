const electron = require('electron')
const BrowserWindow = electron.remote.BrowserWindow;
const { PosPrinter } = electron.remote.require("modified-pos-printer");
const path = require("path");


export default {

    async addProduct({ commit, dispatch }, id) {
        const product = await this.dispatch('supermarket/products/getProduct', id)
        if (await dispatch('getProduct', product.id))
            commit('count', product.id)
        else
            commit('add', product)
    },

    async addProductByBarcode({ commit, dispatch }, barcode) {
        const product = await this.dispatch('supermarket/products/getProductByBarcode', barcode)
        //Products existed
        if (product) {
            if (await dispatch('getProduct', product.id))
                commit('count', product.id)
            else
                commit('add', product)
        } else
            this.$toast.error('هذا المنتج غير موجود') // WHEN SCANNER NOT FOUND THE PRODUCT
    },

    async removeProduct({ commit, dispatch }, id) {
        if ((await dispatch('getProduct', id)).inCount > 1)
            commit('countDown', id)
        else
            commit('remove', id)
    },

    async getProduct({ state, dispatch }, id) {
        return state.products.find(x => x.id == id)
    },

    async setCount({ state, commit, dispatch }, id) {
        const product = await dispatch('getProduct', id)
        return products.find(x => x.id == id)
    },

    async search({ state, commit, dispatch }, id) {
        let orders = await this.$auth.$storage.getLocalStorage('orders')
        if (id == '')
            commit('set_all', orders);
        else
            commit('set_all', orders.filter(x => x.id == id))
    },

    async searchItems({ state }, name) {
        if (!state.onlyProducts) {
            let categories = await this.dispatch('supermarket/categories/getCategories')
            this.commit('supermarket/categories/set_all', categories.filter(x => x.name.includes(name)));
        }

        let products = await this.dispatch('supermarket/products/getProducts')
        this.commit('supermarket/products/set_all', products.filter(x => x.name.includes(name)));
    },

    async fetchOrders({ commit, dispatch }) {
        var orders = await this.$auth.$storage.getLocalStorage('orders')
        if (orders === null) // If not set on the storage
            await this.$axios
                .get('/api/supermarket/orders', { withCredentials: true })
                .then(async (response) => {
                    // Send to Mutations
                    commit('set_all', response.data);
                    //Save To Storage
                    this.$auth.$storage.setLocalStorage('orders', response.data)
                }).catch(error => {
                    throw new Error(`${error}`);
                })
        else
            commit('set_all', orders); // Send to Mutations
    },

    async filterByCategory({ }, category_id) {
        let products = await this.dispatch('supermarket/products/getProducts')
        let categories = await this.dispatch('supermarket/categories/getCategories')

        if (!category_id == 0) {
            products = products.filter(x => x.category_id == category_id)
            // categories = categories.filter(x => (x.id == category_id || x.id == 0))
        }
        this.commit('supermarket/products/set_all', products);
        this.commit('supermarket/categories/set_all', categories);
    },

    emptyProducts({ commit }) {
        this._vm.$dialog.confirm('هل انت متأكد؟').then(() => {
            commit('emptyProducts')
        })
    },

    async fetchLastOrder({ commit }) {
        if (this.$auth.$storage.getLocalStorage('lastOrder'))
            commit('lastOrder', await this.$auth.$storage.getLocalStorage('lastOrder'))
        else
            this.$axios.get(
                '/api/supermarket/orders/last-order', { withCredentials: true }
            ).then((response) => {
                if (response.data.order_number){
                    commit('lastOrder', response.data)
                    this.$auth.$storage.setLocalStorage('lastOrder', response.data)
                }
                else {
                    commit('lastOrder', {order_number: 0})
                    this.$auth.$storage.setLocalStorage('lastOrder', {order_number: 0})
                }
            })

        return await this.$auth.$storage.getLocalStorage('lastOrder')
    },

    async endOrder({ state, commit, dispatch }) {
        let calculatorService = await this.dispatch('supermarket/services/serviceState', 1)
        if (calculatorService && state.calculator == false) {
            commit('calculator')
            return true
        }


        let products = []
        state.products.forEach(x => {
            products.push({ id: x.id, count: x.inCount })
        })

        this.$axios
            .post(
                '/api/supermarket/orders/end-order', { products: products, customer_id: null }, { withCredentials: true }
            ).then((response) => {
                // Reset added products
            }).catch(function (error) {
                console.log(error)
            })

        // Print Order
        if (this.state.supermarket.utilities.printState == true) {
            if (this.state.supermarket.utilities.defaultPrinter == "") {
                this.$toast.info('يرجى تحديد طابعة لإجراء عملية الطباعة')
            } else {
                await dispatch('invoice')
            }
        }

        let lastOrder = { ...await dispatch('fetchLastOrder') }
        lastOrder.id++
        lastOrder.order_number++
        lastOrder.order_price = 0

        await state.products.forEach(x => {
            lastOrder.order_price += x.inCount * x.price
            this.commit('supermarket/products/changeCount', { id: x.id, count: x.inCount * -1 })
        })

        await this.dispatch('supermarket/products/syncLocalStorage')

        commit('lastOrder', lastOrder)
        this.$auth.$storage.setLocalStorage('lastOrder', lastOrder)

        commit('emptyProducts')

        this.$toast.success('تم انهاء الطلب')
        if (this.isOffline)
            this.$toast.info('سيتم ارسال الطلب عند عودة الانترنت')

        if (calculatorService)
            commit('calculator')
    },

    selectCategory({ commit }, id) {
        commit('selectCategory', id)
    },

    hideCategories({ commit }) {
        commit('hideCategories')
    },


    async invoice({ state }) {
        let products = []
        let total = state.products.reduce((sum, { price, inCount }) => sum + price * inCount, 0)

        state.products.forEach((x, i) => {
            products.push(
                [
                    x.price * x.inCount,
                    x.inCount,
                    x.price,
                    x.name,
                    ++i,
                ]
            )
        })

        const data = [
            {
                type: 'text',
                value: 'Supermarket Name',
                style: `text-align:center;`,
                css: { "font-weight": "700", "font-size": "18px" }
            }, {
                type: 'table',
                // style the table
                style: 'border: 1px solid #ddd',
                // list of the columns to be rendered in the table header
                tableHeader: [
                    'المجموع',
                    'العدد',
                    'السعر',
                    'المنتج',
                    '#',
                ],
                // multi dimensional array depicting the rows and columns of the table body
                tableBody: products,
                // list of columns to be rendered in the table footer
                tableFooter: [
                    total,
                    'المجموع'
                ],
                // custom style for the table header
                tableHeaderStyle: 'background-color: #000; color: white;',
                // custom style for the table body
                tableBodyStyle: 'border: 0.5px solid #ddd',
                // custom style for the table footer
                tableFooterStyle: 'background-color: #000; color: white;',
            },
            {
                type: 'barCode',
                value: 'HB4587896',
                height: 12,                     // height of barcode, applicable only to bar and QR codes
                width: 1,          // width of barcode, applicable only to bar and QR codes
                displayValue: true,             // Display value below barcode
                fontsize: 8,
            },
        ]

        // returns promise<any>
        await PosPrinter.print(data, {
            printerName: this.state.supermarket.utilities.defaultPrinter,
            width: '100%',               //  width of content body
            margin: '0 0 0 0',            // margin of content body
            copies: 1,                   // The number of copies to print
            timeOutPerLine: 10000,
            silent: true,
        })
            .catch((error) => {
                console.error(error);
            });
    },



}