const generateContent  = require("../utils/genContent");

exports.genContent = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await generateContent(text);
        res.json({ response });

    } catch (error) {
        res.status(500).json({ message: "Error during content generation", error });
    }
}

