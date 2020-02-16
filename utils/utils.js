// export a function to set payloads
module.exports = {
    setPayload: function(restaurants) {
        restaurants.forEach((rest, idx) => {
            rest.buttons[1].payload = 'SEE_DETAILS_' + idx;
            rest.buttons[2].payload = 'REMOVE_IT_' + idx;
            rest.buttons[0].payload = 'SELECT_IT_' + idx;
        })
    }
};
