const generateProductCode = (name, category) => {
    const nameAbbrev = name.trim().toUpperCase().slice(0, 5).replace(/\s+/g, '');
    const categoryAbbrev = category.trim().toUpperCase().slice(0, 5).replace(/\s+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 char random

    return `${nameAbbrev}-${categoryAbbrev}-${uniqueSuffix}`;
};


module.exports = {generateProductCode};