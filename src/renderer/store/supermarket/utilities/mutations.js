export default {
    setColor(state, data) {
        state.color = data
    },

    setPrinters(state, data) {
        state.printers = data
    },

    setDefaultPrinter(state, name) {
        state.defaultPrinter = name
    },

    setPrintState(state, data) {
        state.printState = data
    },

    togglePrintState(state) {
        state.printState = !state.printState
        console.log(state.printState)
    }
}