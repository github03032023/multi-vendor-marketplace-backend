const validateAddresses = (addresses) => {
    // Check if 
    if (!Array.isArray(addresses)) {
        addresses = [addresses];
    }

    for (const address of addresses) {
        const { street, city, state, postalCode, country } = address;
        if (!state || !postalCode || !country) {
            return false; // Validation failed
        }
    }
    return true; 
};

module.exports = {validateAddresses};
