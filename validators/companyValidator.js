// Validator for companyDetails
const validateCompanyDetails = (companyDetails) => {
    if (!companyDetails) return false;

    const { companyName, companyAddress, companyType } = companyDetails;

    // Check for required fields
    if (!companyName || !companyType) return false;

    // Validate companyType against allowed values
    const validCompanyTypes = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company'];
    if (!validCompanyTypes.includes(companyType)) return false;

    // Validate companyAddress
    return validateAddress(companyAddress);
};

// Validator for bankAccount
const validateBankAccount = (bankAccount) => {
    if (!bankAccount) return false;

    const { accountHolderName, accountNumber, bankName, branchName } = bankAccount;

    // Check for required fields
    if (!accountHolderName || !accountNumber || !bankName || !branchName) return false;

    return true;
};

// Helper function to validate address objects
const validateAddress = (address) => {
    if (!address) return false;

    const { street, city, state, postalCode, country } = address;

    // Check for required fields
    if (!state || !postalCode || !country) return false;

    return true;
};

module.exports = { validateCompanyDetails, validateBankAccount };
