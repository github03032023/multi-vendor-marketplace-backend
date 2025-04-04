const bcrypt = require("bcrypt");

const encryptPassword = async(password) => {
    const encryptedPassword = await bcrypt.hash(password, 12);
    return encryptedPassword;
}

const comparePassword = async(password, encryptedPassword) => {
    const passwordMatch = await bcrypt.compare(password, encryptedPassword);
    return passwordMatch;
}

module.exports = {encryptPassword, comparePassword};
