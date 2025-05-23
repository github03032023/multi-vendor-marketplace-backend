const cloudinary = require('cloudinary').v2;
const HomepageSection = require('../models/homePageSectionModel');
// CREATE section
const createHomePageSection = async (req, res) => {
    try {
        const { title, description, linkedProducts } = req.body;

        if (!title) return res.status(400).json({ error: 'Title is required.' });
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: 'At least one image is required.' });

        const linkedProductsArray = linkedProducts ? JSON.parse(linkedProducts) : [];
        const imageDescriptions = JSON.parse(req.body.imageDescriptions || '[]');

        const images = req.files.map((file, index) => ({
            url: file.path,
            publicId: file.filename,
            description: imageDescriptions[index],
            linkedProduct: linkedProductsArray[index] || null,
        }));

        const newSection = new HomepageSection({ title, description, images });
        await newSection.save();

        res.status(201).json(newSection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create homepage section.' });
    }
};

// GET all
const getAllHomePageSections = async (req, res) => {
    try {
        const sections = await HomepageSection.find().populate('images.linkedProduct');
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch homepage sections.' });
    }
};

// DELETE section
const deleteHomePageSection = async (req, res) => {
    try {
        const sectionId = req.params.id;
        const section = await HomepageSection.findById(sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        const deletePromises = section.images.map((img) =>
            cloudinary.uploader.destroy(img.publicId)
        );
        await Promise.all(deletePromises);

        await HomepageSection.findByIdAndDelete(sectionId);
        res.status(200).json({ message: 'Section deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete section', error: err.message });
    }
};


module.exports = {
    createHomePageSection,
    getAllHomePageSections,
    deleteHomePageSection,
};
